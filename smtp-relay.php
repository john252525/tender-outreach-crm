<?php
/**
 * SMTP Relay — однофайловый скрипт для VPS.
 *
 * Принимает POST-запрос с JSON:
 *   { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, emailFrom,
 *     to, subject, body, inReplyTo? }
 *
 * Отправляет письмо через fsockopen/SMTP и возвращает JSON-ответ.
 *
 * Защита: заголовок  X-Relay-Secret  должен совпадать с $SECRET ниже.
 * Поменяйте секрет перед деплоем!
 */

$SECRET = getenv('RELAY_SECRET') ?: 'CHANGE_ME_TO_RANDOM_STRING';

header('Content-Type: application/json; charset=utf-8');

// --- helpers -----------------------------------------------------------

function json_ok(array $data): never {
    echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE);
    exit;
}
function json_err(string $msg, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

// --- auth --------------------------------------------------------------

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_err('POST only', 405);
}

$authHeader = $_SERVER['HTTP_X_RELAY_SECRET'] ?? '';
if ($authHeader !== $SECRET) {
    json_err('Unauthorized', 401);
}

// --- parse body --------------------------------------------------------

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) json_err('Invalid JSON body');

$smtpHost   = $input['smtpHost']   ?? '';
$smtpPort   = (int)($input['smtpPort'] ?? 587);
$smtpUser   = $input['smtpUser']   ?? '';
$smtpPass   = $input['smtpPass']   ?? '';
$smtpSecure = !empty($input['smtpSecure']);
$emailFrom  = $input['emailFrom']  ?? $smtpUser;
$to         = $input['to']         ?? '';
$subject    = $input['subject']    ?? '';
$body       = $input['body']       ?? '';
$inReplyTo  = $input['inReplyTo']  ?? '';

if (!$smtpHost || !$smtpUser || !$smtpPass || !$to) {
    json_err('Missing required fields: smtpHost, smtpUser, smtpPass, to');
}

// --- build message -----------------------------------------------------

$boundary = md5(uniqid(microtime(true)));
$messageId = '<' . bin2hex(random_bytes(16)) . '@' . gethostname() . '>';
$date = date('r');

$headers  = "From: $emailFrom\r\n";
$headers .= "To: $to\r\n";
$headers .= "Subject: $subject\r\n";
$headers .= "Date: $date\r\n";
$headers .= "Message-ID: $messageId\r\n";
if ($inReplyTo) {
    $headers .= "In-Reply-To: $inReplyTo\r\n";
    $headers .= "References: $inReplyTo\r\n";
}
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";
$headers .= "Content-Transfer-Encoding: base64\r\n";
$headers .= "\r\n";
$headers .= chunk_split(base64_encode($body));

// --- smtp send ---------------------------------------------------------

function smtp_send(
    string $host, int $port, bool $secure,
    string $user, string $pass,
    string $from, string $to,
    string $data, array &$log
): bool {
    $prefix = $secure ? 'ssl://' : '';
    $errno = 0; $errstr = '';

    $log[] = "Connecting to {$prefix}{$host}:{$port}";
    $fp = @fsockopen($prefix . $host, $port, $errno, $errstr, 15);
    if (!$fp) {
        $log[] = "Connection failed: $errstr ($errno)";
        return false;
    }
    stream_set_timeout($fp, 30);

    $readLine = function() use ($fp): string {
        $line = '';
        while (($ch = fgetc($fp)) !== false) {
            $line .= $ch;
            if ($ch === "\n") break;
        }
        return $line;
    };

    $read = function() use ($readLine, &$log): string {
        $response = '';
        while (true) {
            $line = $readLine();
            $response .= $line;
            // Multiline response: 250-xxx ... last line: 250 xxx
            if (strlen($line) < 4 || $line[3] === ' ' || $line[3] === "\r") break;
        }
        $log[] = "< " . trim($response);
        return $response;
    };

    $write = function(string $cmd) use ($fp, &$log): void {
        $log[] = "> " . trim($cmd);
        fwrite($fp, $cmd);
    };

    $expectCode = function(string $response, string $code): bool {
        return str_starts_with($response, $code);
    };

    // Greeting
    $r = $read();
    if (!$expectCode($r, '220')) { fclose($fp); return false; }

    // EHLO
    $write("EHLO relay\r\n");
    $r = $read();
    if (!$expectCode($r, '250')) { fclose($fp); return false; }

    // STARTTLS if not already SSL
    if (!$secure && stripos($r, 'STARTTLS') !== false) {
        $write("STARTTLS\r\n");
        $r = $read();
        if ($expectCode($r, '220')) {
            $crypto = stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT);
            if (!$crypto) {
                $log[] = "STARTTLS handshake failed";
                fclose($fp);
                return false;
            }
            // Re-EHLO after STARTTLS
            $write("EHLO relay\r\n");
            $r = $read();
        }
    }

    // AUTH LOGIN
    $write("AUTH LOGIN\r\n");
    $r = $read();
    if (!$expectCode($r, '334')) { fclose($fp); return false; }

    $write(base64_encode($user) . "\r\n");
    $r = $read();
    if (!$expectCode($r, '334')) { fclose($fp); return false; }

    $write(base64_encode($pass) . "\r\n");
    $r = $read();
    if (!$expectCode($r, '235')) {
        $log[] = "AUTH failed";
        fclose($fp);
        return false;
    }

    // MAIL FROM
    $write("MAIL FROM:<$from>\r\n");
    $r = $read();
    if (!$expectCode($r, '250')) { fclose($fp); return false; }

    // RCPT TO
    $write("RCPT TO:<$to>\r\n");
    $r = $read();
    if (!$expectCode($r, '250') && !$expectCode($r, '251')) { fclose($fp); return false; }

    // DATA
    $write("DATA\r\n");
    $r = $read();
    if (!$expectCode($r, '354')) { fclose($fp); return false; }

    fwrite($fp, $data . "\r\n.\r\n");
    $r = $read();
    if (!$expectCode($r, '250')) { fclose($fp); return false; }

    // QUIT
    $write("QUIT\r\n");
    @$read();
    fclose($fp);
    return true;
}

// Try multiple port/secure combinations
$attempts = [
    ['port' => $smtpPort, 'secure' => $smtpSecure],
];
if ($smtpPort === 587 || (!$smtpSecure && $smtpPort !== 465)) {
    $attempts[] = ['port' => 465, 'secure' => true];
}
if ($smtpPort === 465 || ($smtpSecure && $smtpPort !== 587)) {
    $attempts[] = ['port' => 587, 'secure' => false];
}
if ($smtpPort !== 25) {
    $attempts[] = ['port' => 25, 'secure' => false];
}

// Deduplicate
$seen = [];
$unique = [];
foreach ($attempts as $a) {
    $key = $a['port'] . ':' . ($a['secure'] ? '1' : '0');
    if (!isset($seen[$key])) { $seen[$key] = true; $unique[] = $a; }
}
$attempts = $unique;

$log = [];
$sent = false;
foreach ($attempts as $a) {
    $log[] = "--- Attempt port={$a['port']} secure=" . ($a['secure'] ? 'true' : 'false');
    $sent = smtp_send(
        $smtpHost, $a['port'], $a['secure'],
        $smtpUser, $smtpPass,
        $emailFrom, $to,
        $headers,
        $log
    );
    if ($sent) break;
}

if ($sent) {
    json_ok([
        'messageId' => $messageId,
        'log' => $log,
    ]);
} else {
    json_err("All SMTP attempts failed.\n" . implode("\n", $log), 502);
}

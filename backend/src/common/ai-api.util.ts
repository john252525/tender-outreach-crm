type AiJsonResponse = Record<string, unknown>;

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRYABLE_MESSAGE_RE = /too busy|service unavailable|temporarily unavailable|overloaded|timeout|timed out|try again/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorMessage(status: number, bodyText: string): string {
  const fallback = `AI API returned status ${status}`;

  if (!bodyText.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(bodyText) as {
      message?: string;
      error?: string | { message?: string; code?: string; type?: string };
      answer?: string;
    };

    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error.trim();
    }

    if (
      parsed.error &&
      typeof parsed.error === 'object' &&
      typeof parsed.error.message === 'string' &&
      parsed.error.message.trim()
    ) {
      return parsed.error.message.trim();
    }

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim();
    }

    if (typeof parsed.answer === 'string' && parsed.answer.trim()) {
      return parsed.answer.trim();
    }
  } catch {
    // Fall through to plain text handling.
  }

  return bodyText.trim().slice(0, 500);
}

function buildQuestionUrl(baseUrl: string, question: string): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('question', question);
    return url.toString();
  } catch {
    const encoded = encodeURIComponent(question);
    if (/[?&]question=/.test(baseUrl)) {
      return baseUrl.replace(/([?&]question=)[^&]*/i, `$1${encoded}`);
    }

    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}question=${encoded}`;
  }
}

async function requestViaPost(
  aiUrl: string,
  question: string,
): Promise<Response> {
  return fetch(aiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(120000),
  });
}

async function requestViaGet(
  aiUrl: string,
  question: string,
): Promise<Response> {
  return fetch(buildQuestionUrl(aiUrl, question), {
    method: 'GET',
    signal: AbortSignal.timeout(120000),
  });
}

export async function callAiApi(
  aiUrl: string,
  question: string,
): Promise<AiJsonResponse> {
  const hasQuestionParam = /[?&]question=/i.test(aiUrl);
  const modes = hasQuestionParam
    ? [requestViaPost, requestViaGet]
    : [requestViaPost];

  let lastMessage = 'AI API request failed';
  let lastStatus = 0;

  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const mode of modes) {
      const response = await mode(aiUrl, question);

      if (response.ok) {
        return (await response.json()) as AiJsonResponse;
      }

      const bodyText = await response.text();
      lastStatus = response.status;
      lastMessage = extractErrorMessage(response.status, bodyText);

      const canRetry = RETRYABLE_STATUSES.has(response.status) || RETRYABLE_MESSAGE_RE.test(lastMessage);
      const isLastMode = mode === modes[modes.length - 1];

      if (!canRetry && isLastMode) {
        throw new Error(lastMessage);
      }
    }

    if (attempt < 3 && (RETRYABLE_STATUSES.has(lastStatus) || RETRYABLE_MESSAGE_RE.test(lastMessage))) {
      await sleep(attempt * 1500);
      continue;
    }

    break;
  }

  throw new Error(lastMessage);
}

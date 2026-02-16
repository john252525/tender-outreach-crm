import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Client } from 'ssh2';
import { SshServer } from './entities/ssh-server.entity';
import { CryptoUtil } from './utils/crypto.util';

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class SshService {
  private readonly logger = new Logger(SshService.name);
  private createConnection(server: SshServer): Promise<Client> {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      const config: Record<string, unknown> = {
        host: server.host,
        port: server.port || 22,
        username: server.username,
        readyTimeout: 10000,
      };

      if (server.authType === 'key' && server.encryptedPrivateKey) {
        config.privateKey = CryptoUtil.decrypt(server.encryptedPrivateKey);
      } else if (server.encryptedPassword) {
        config.password = CryptoUtil.decrypt(server.encryptedPassword);
      }

      conn
        .on('ready', () => resolve(conn))
        .on('error', (err) => reject(err))
        .connect(config);
    });
  }

  private executeCommand(conn: Client, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream
          .on('data', (data: Buffer) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
          });

        stream.on('close', () => {
          conn.end();
          if (stderr && !stdout) {
            reject(new Error(stderr.trim()));
          } else {
            resolve(stdout);
          }
        });
      });
    });
  }

  private validatePath(path: string): void {
    if (!path.startsWith('/')) {
      throw new BadRequestException('Путь должен быть абсолютным');
    }
    if (path.includes('\0')) {
      throw new BadRequestException('Некорректный путь');
    }
    const segments = path.split('/');
    if (segments.includes('..')) {
      throw new BadRequestException('Переход по директориям (..) запрещён');
    }
  }

  async listDirectory(server: SshServer, path: string): Promise<DirectoryEntry[]> {
    this.validatePath(path);

    this.logger.log(`Connecting to ${server.host}:${server.port} as ${server.username} (auth: ${server.authType})`);

    let conn: Client;
    try {
      conn = await this.createConnection(server);
    } catch (error) {
      const msg = getErrorMessage(error);
      this.logger.error(`SSH connection failed to ${server.host}: ${msg}`);
      throw new InternalServerErrorException(
        `Не удалось подключиться к серверу: ${msg}`,
      );
    }

    const escapedPath = path.replace(/'/g, "'\\''");
    const command = `ls -la --time-style=long-iso '${escapedPath}' 2>/dev/null || ls -la '${escapedPath}' 2>/dev/null`;

    try {
      const output = await this.executeCommand(conn, command);
      return this.parseLsOutput(output, path);
    } catch (error) {
      const msg = getErrorMessage(error);
      this.logger.error(`Command failed on ${server.host}: ${msg}`);
      throw new InternalServerErrorException(
        `Ошибка при чтении директории: ${msg}`,
      );
    }
  }

  async listRecursive(server: SshServer, path: string): Promise<string[]> {
    this.validatePath(path);

    let conn: Client;
    try {
      conn = await this.createConnection(server);
    } catch (error) {
      const msg = getErrorMessage(error);
      this.logger.error(`SSH connection failed to ${server.host}: ${msg}`);
      throw new InternalServerErrorException(
        `Не удалось подключиться к серверу: ${msg}`,
      );
    }

    const escapedPath = path.replace(/'/g, "'\\''");
    const command = `find '${escapedPath}' -maxdepth 5 -type f 2>/dev/null | head -5000`;

    try {
      const output = await this.executeCommand(conn, command);
      return output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } catch (error) {
      const msg = getErrorMessage(error);
      this.logger.error(`Recursive list failed on ${server.host}: ${msg}`);
      throw new InternalServerErrorException(
        `Ошибка при рекурсивном чтении: ${msg}`,
      );
    }
  }

  private parseLsOutput(output: string, basePath: string): DirectoryEntry[] {
    const lines = output.split('\n').filter((l) => l.trim());
    const entries: DirectoryEntry[] = [];

    for (const line of lines) {
      if (line.startsWith('total ')) continue;

      const parts = line.split(/\s+/);
      if (parts.length < 8) continue;

      const permissions = parts[0];
      const size = parseInt(parts[4], 10);
      const name = parts.slice(7).join(' ');

      if (name === '.' || name === '..' || !name) continue;

      // Handle symlink names (name -> target)
      const displayName = name.includes(' -> ') ? name.split(' -> ')[0] : name;

      const isDirectory = permissions.startsWith('d');
      const fullPath = basePath === '/' ? `/${displayName}` : `${basePath}/${displayName}`;

      entries.push({
        name: displayName,
        path: fullPath,
        isDirectory,
        size: isNaN(size) ? 0 : size,
        modifiedAt: `${parts[5]} ${parts[6]}`,
      });
    }

    // Sort: directories first, then alphabetically
    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return entries;
  }
}

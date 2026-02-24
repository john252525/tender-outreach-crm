import { Injectable, BadRequestException } from '@nestjs/common';

const BASE_URL = 'https://cloud.controller.touch-api.com/api';

@Injectable()
export class TouchApiService {
  private getToken(user: { settings?: { touchApiToken?: string } | null }): string {
    const token = user.settings?.touchApiToken;
    if (!token) {
      throw new BadRequestException('Настройте TouchAPI Token в профиле');
    }
    return token;
  }

  private async post(
    endpoint: string,
    body: Record<string, unknown>,
    timeout = 15000,
  ): Promise<any> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeout),
      });
    } catch (error: any) {
      throw new BadRequestException(
        `TouchAPI ${endpoint}: ${error?.message || 'network error'}`,
      );
    }
    try {
      return await res.json();
    } catch {
      throw new BadRequestException(
        `TouchAPI ${endpoint}: invalid response (status ${res.status})`,
      );
    }
  }

  async getInfo(
    user: { settings?: { touchApiToken?: string } | null },
    source = 'whatsapp',
  ): Promise<any> {
    const token = this.getToken(user);
    return this.post('getInfoByToken', { source, token });
  }

  async addAccount(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    source = 'whatsapp',
  ): Promise<any> {
    const token = this.getToken(user);
    return this.post('addAccount', { source, token, login });
  }

  async setState(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    state: boolean,
    source = 'whatsapp',
  ): Promise<any> {
    const token = this.getToken(user);
    if (state) {
      return this.post('setState', { source, token, login, setState: true }, 30000);
    } else {
      return this.post('forceStop', { source, token, login });
    }
  }

  async getQr(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    source = 'whatsapp',
  ): Promise<any> {
    const token = this.getToken(user);
    return this.post('getQr', { source, token, login });
  }

  async deleteAccount(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    source = 'whatsapp',
  ): Promise<any> {
    const token = this.getToken(user);
    // forceStop may fail if already stopped — non-fatal
    try {
      await this.post('forceStop', { source, token, login });
    } catch {}
    return this.post('deleteAccount', { source, token, login });
  }

  async resetAccount(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    source = 'whatsapp',
  ): Promise<any> {
    const token = this.getToken(user);
    // forceStop may fail if already stopped — non-fatal
    try {
      await this.post('forceStop', { source, token, login });
    } catch {}
    await this.post('clearSession', { source, token, login });
    await this.post('setState', { source, token, login, setState: true }, 30000);
    return this.post('getQr', { source, token, login });
  }

  async getChats(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    source = 'whatsapp',
  ): Promise<any> {
    const token = this.getToken(user);
    return this.post('getChats', { source, token, login }, 30000);
  }

  async getChatMessages(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    to: string,
    source = 'whatsapp',
  ): Promise<any> {
    const token = this.getToken(user);
    return this.post('getChatMessages', { source, token, login, to }, 30000);
  }

  async sendMessage(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    to: string,
    text: string,
    source = 'whatsapp',
    content?: Array<{ type: string; src: string; filename?: string }>,
  ): Promise<any> {
    const token = this.getToken(user);
    const msg: Record<string, unknown> = { to, text };
    if (content && content.length > 0) {
      msg.content = content;
    }
    return this.post('sendMessage', { source, token, login, msg }, 30000);
  }

  async getScreenshot(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    source = 'whatsapp',
  ): Promise<{ url: string }> {
    const token = this.getToken(user);
    return {
      url: `${BASE_URL}/screenshot?source=${encodeURIComponent(source)}&token=${encodeURIComponent(token)}&login=${encodeURIComponent(login)}`,
    };
  }
}

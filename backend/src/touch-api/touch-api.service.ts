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
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
    return res.json();
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
    await this.post('forceStop', { source, token, login });
    return this.post('deleteAccount', { source, token, login });
  }

  async resetAccount(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    source = 'whatsapp',
  ): Promise<any> {
    const token = this.getToken(user);
    await this.post('forceStop', { source, token, login });
    await this.post('clearSession', { source, token, login });
    await this.post('setState', { source, token, login, setState: true }, 30000);
    return this.post('getQr', { source, token, login });
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

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

  async getInfo(user: { settings?: { touchApiToken?: string } | null }): Promise<any> {
    const token = this.getToken(user);
    const res = await fetch(`${BASE_URL}/getInfoByToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'whatsapp', token }),
      signal: AbortSignal.timeout(15000),
    });
    return res.json();
  }

  async addAccount(user: { settings?: { touchApiToken?: string } | null }, login: string): Promise<any> {
    const token = this.getToken(user);
    const res = await fetch(`${BASE_URL}/addAccount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'whatsapp', token, login }),
      signal: AbortSignal.timeout(15000),
    });
    return res.json();
  }

  async setState(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
    state: boolean,
  ): Promise<any> {
    const token = this.getToken(user);

    if (state) {
      const res = await fetch(`${BASE_URL}/setState`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'whatsapp', token, login, setState: true }),
        signal: AbortSignal.timeout(30000),
      });
      return res.json();
    } else {
      const res = await fetch(`${BASE_URL}/forceStop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'whatsapp', token, login }),
        signal: AbortSignal.timeout(15000),
      });
      return res.json();
    }
  }

  async getScreenshot(
    user: { settings?: { touchApiToken?: string } | null },
    login: string,
  ): Promise<{ url: string }> {
    const token = this.getToken(user);
    // The screenshot endpoint returns a 307 redirect to the actual image.
    // We return the URL for the frontend to load directly as <img>.
    return {
      url: `${BASE_URL}/screenshot?source=whatsapp&token=${encodeURIComponent(token)}&login=${encodeURIComponent(login)}`,
    };
  }
}

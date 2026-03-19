import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from './entities/api-key.entity';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeysRepository: Repository<ApiKey>,
  ) {}

  private generateApiKey(): string {
    const bytes = crypto.randomBytes(32);
    return 'oak_' + bytes.toString('hex');
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async createKey(
    userId: string,
    name: string,
    expiresAt?: Date,
  ): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const rawKey = this.generateApiKey();
    const keyHash = this.hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = this.apiKeysRepository.create({
      userId,
      name,
      keyHash,
      keyPrefix,
      expiresAt: expiresAt || null,
    });

    const saved = await this.apiKeysRepository.save(apiKey);
    return { apiKey: saved, rawKey };
  }

  async getKeys(userId: string): Promise<ApiKey[]> {
    return this.apiKeysRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteKey(id: string, userId: string): Promise<void> {
    const key = await this.apiKeysRepository.findOne({
      where: { id, userId },
    });
    if (!key) {
      throw new NotFoundException('API ключ не найден');
    }
    await this.apiKeysRepository.remove(key);
  }

  async toggleKey(id: string, userId: string): Promise<ApiKey> {
    const key = await this.apiKeysRepository.findOne({
      where: { id, userId },
    });
    if (!key) {
      throw new NotFoundException('API ключ не найден');
    }
    key.isActive = !key.isActive;
    return this.apiKeysRepository.save(key);
  }

  async validateKey(rawKey: string): Promise<ApiKey | null> {
    const keyHash = this.hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = await this.apiKeysRepository.findOne({
      where: { keyPrefix, keyHash, isActive: true },
      relations: ['user'],
    });

    if (!apiKey) return null;

    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return null;
    }

    apiKey.lastUsedAt = new Date();
    await this.apiKeysRepository.save(apiKey);

    return apiKey;
  }
}

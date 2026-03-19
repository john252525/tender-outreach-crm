import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { CryptoSource } from './entities/crypto-source.entity';
import { CryptoDeal } from './entities/crypto-deal.entity';

@Injectable()
export class CryptoDealsService {
  constructor(
    @InjectRepository(CryptoSource)
    private readonly sourcesRepo: Repository<CryptoSource>,
    @InjectRepository(CryptoDeal)
    private readonly dealsRepo: Repository<CryptoDeal>,
  ) {}

  private generateSlug(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async createSource(userId: string, name: string): Promise<CryptoSource> {
    const slug = this.generateSlug();
    const source = this.sourcesRepo.create({ userId, name, slug });
    return this.sourcesRepo.save(source);
  }

  async getSources(userId: string): Promise<CryptoSource[]> {
    return this.sourcesRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSourceWithDealsCount(userId: string): Promise<(CryptoSource & { dealsCount: number })[]> {
    const sources = await this.sourcesRepo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId })
      .loadRelationCountAndMap('s.dealsCount', 's.deals')
      .orderBy('s.created_at', 'DESC')
      .getMany();
    return sources as (CryptoSource & { dealsCount: number })[];
  }

  async deleteSource(id: string, userId: string): Promise<void> {
    const source = await this.sourcesRepo.findOne({ where: { id, userId } });
    if (!source) {
      throw new NotFoundException('Источник не найден');
    }
    await this.sourcesRepo.remove(source);
  }

  async toggleSource(id: string, userId: string): Promise<CryptoSource> {
    const source = await this.sourcesRepo.findOne({ where: { id, userId } });
    if (!source) {
      throw new NotFoundException('Источник не найден');
    }
    source.isActive = !source.isActive;
    return this.sourcesRepo.save(source);
  }

  async receiveDeal(
    slug: string,
    payload: Record<string, unknown>,
    senderIp: string | null,
  ): Promise<CryptoDeal> {
    const source = await this.sourcesRepo.findOne({ where: { slug, isActive: true } });
    if (!source) {
      throw new NotFoundException('Источник не найден или неактивен');
    }
    const deal = this.dealsRepo.create({
      sourceId: source.id,
      payload,
      senderIp,
    });
    return this.dealsRepo.save(deal);
  }

  async getDeals(
    userId: string,
    sourceId?: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: CryptoDeal[]; total: number }> {
    const qb = this.dealsRepo
      .createQueryBuilder('d')
      .innerJoin('d.source', 's')
      .where('s.user_id = :userId', { userId });

    if (sourceId) {
      qb.andWhere('d.source_id = :sourceId', { sourceId });
    }

    qb.orderBy('d.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getDeal(id: string, userId: string): Promise<CryptoDeal> {
    const deal = await this.dealsRepo
      .createQueryBuilder('d')
      .innerJoin('d.source', 's')
      .where('d.id = :id', { id })
      .andWhere('s.user_id = :userId', { userId })
      .leftJoinAndSelect('d.source', 'source')
      .getOne();
    if (!deal) {
      throw new NotFoundException('Сделка не найдена');
    }
    return deal;
  }

  async deleteDeal(id: string, userId: string): Promise<void> {
    const deal = await this.dealsRepo
      .createQueryBuilder('d')
      .innerJoin('d.source', 's')
      .where('d.id = :id', { id })
      .andWhere('s.user_id = :userId', { userId })
      .getOne();
    if (!deal) {
      throw new NotFoundException('Сделка не найдена');
    }
    await this.dealsRepo.remove(deal);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoSource } from './entities/crypto-source.entity';
import { CryptoDeal } from './entities/crypto-deal.entity';
import { CryptoDealsService } from './crypto-deals.service';
import { CryptoDealsController } from './crypto-deals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CryptoSource, CryptoDeal])],
  controllers: [CryptoDealsController],
  providers: [CryptoDealsService],
  exports: [CryptoDealsService],
})
export class CryptoDealsModule {}

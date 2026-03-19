import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { CryptoDealsService } from './crypto-deals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateSourceDto } from './dto/create-source.dto';

@ApiTags('Crypto Deals')
@Controller('crypto-deals')
export class CryptoDealsController {
  constructor(private readonly cryptoDealsService: CryptoDealsService) {}

  // === Sources (authenticated) ===

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('sources')
  async createSource(
    @CurrentUser() user: User,
    @Body() dto: CreateSourceDto,
  ) {
    return this.cryptoDealsService.createSource(user.id, dto.name);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sources')
  async getSources(@CurrentUser() user: User) {
    return this.cryptoDealsService.getSourceWithDealsCount(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('sources/:id/toggle')
  async toggleSource(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.cryptoDealsService.toggleSource(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('sources/:id')
  async deleteSource(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.cryptoDealsService.deleteSource(id, user.id);
    return { success: true };
  }

  // === Webhook (public) ===

  @Post('webhook/:slug')
  async receiveDeal(
    @Param('slug') slug: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket.remoteAddress
      || null;
    await this.cryptoDealsService.receiveDeal(slug, body, ip);
    return { success: true };
  }

  // === Deals (authenticated) ===

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('deals')
  async getDeals(
    @CurrentUser() user: User,
    @Query('sourceId') sourceId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cryptoDealsService.getDeals(
      user.id,
      sourceId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('deals/:id')
  async getDeal(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.cryptoDealsService.getDeal(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('deals/:id')
  async deleteDeal(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.cryptoDealsService.deleteDeal(id, user.id);
    return { success: true };
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async createKey(
    @CurrentUser() user: User,
    @Body() body: { name: string; expiresAt?: string },
  ) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    const { apiKey, rawKey } = await this.apiKeysService.createKey(
      user.id,
      body.name,
      expiresAt,
    );
    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      keyPrefix: apiKey.keyPrefix,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  @Get()
  async getKeys(@CurrentUser() user: User) {
    const keys = await this.apiKeysService.getKeys(user.id);
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
    }));
  }

  @Patch(':id/toggle')
  async toggleKey(@CurrentUser() user: User, @Param('id') id: string) {
    const key = await this.apiKeysService.toggleKey(id, user.id);
    return {
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    };
  }

  @Delete(':id')
  async deleteKey(@CurrentUser() user: User, @Param('id') id: string) {
    await this.apiKeysService.deleteKey(id, user.id);
    return { success: true };
  }
}

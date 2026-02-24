import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TouchApiService } from './touch-api.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('TouchAPI')
@ApiBearerAuth()
@Controller('touch-api')
@UseGuards(JwtAuthGuard)
export class TouchApiController {
  constructor(private readonly touchApiService: TouchApiService) {}

  @Get('info')
  getInfo(@CurrentUser() user: User, @Query('source') source?: string) {
    return this.touchApiService.getInfo(user, source);
  }

  @Post('add-account')
  addAccount(
    @CurrentUser() user: User,
    @Body('login') login: string,
    @Body('source') source?: string,
  ) {
    return this.touchApiService.addAccount(user, login, source);
  }

  @Post('set-state')
  setState(
    @CurrentUser() user: User,
    @Body('login') login: string,
    @Body('state') state: boolean,
    @Body('source') source?: string,
  ) {
    return this.touchApiService.setState(user, login, state, source);
  }

  @Post('get-qr')
  getQr(
    @CurrentUser() user: User,
    @Body('login') login: string,
    @Body('source') source?: string,
  ) {
    return this.touchApiService.getQr(user, login, source);
  }

  @Post('delete-account')
  deleteAccount(
    @CurrentUser() user: User,
    @Body('login') login: string,
    @Body('source') source?: string,
  ) {
    return this.touchApiService.deleteAccount(user, login, source);
  }

  @Post('reset-account')
  resetAccount(
    @CurrentUser() user: User,
    @Body('login') login: string,
    @Body('source') source?: string,
  ) {
    return this.touchApiService.resetAccount(user, login, source);
  }

  @Post('get-chats')
  getChats(
    @CurrentUser() user: User,
    @Body('login') login: string,
    @Body('source') source?: string,
  ) {
    return this.touchApiService.getChats(user, login, source);
  }

  @Post('get-chat-messages')
  getChatMessages(
    @CurrentUser() user: User,
    @Body('login') login: string,
    @Body('to') to: string,
    @Body('source') source?: string,
  ) {
    return this.touchApiService.getChatMessages(user, login, to, source);
  }

  @Post('send-message')
  sendMessage(
    @CurrentUser() user: User,
    @Body('login') login: string,
    @Body('to') to: string,
    @Body('text') text: string,
    @Body('source') source?: string,
    @Body('content') content?: Array<{ type: string; src: string; filename?: string }>,
  ) {
    return this.touchApiService.sendMessage(user, login, to, text, source, content);
  }

  @Get('screenshot')
  getScreenshot(
    @CurrentUser() user: User,
    @Query('login') login: string,
    @Query('source') source?: string,
  ) {
    return this.touchApiService.getScreenshot(user, login, source);
  }
}

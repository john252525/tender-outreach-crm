import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Emails')
@ApiBearerAuth()
@Controller('emails')
@UseGuards(JwtAuthGuard)
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('send')
  sendEmail(
    @CurrentUser() user: User,
    @Body('to') to: string,
    @Body('subject') subject: string,
    @Body('body') body: string,
    @Body('purchaseId') purchaseId?: string,
    @Body('inReplyTo') inReplyTo?: string,
  ) {
    return this.emailsService.sendEmail(
      user.id,
      user.settings || {},
      to,
      subject,
      body,
      purchaseId,
      inReplyTo,
    );
  }

  @Post('fetch-inbox')
  fetchInbox(@CurrentUser() user: User) {
    return this.emailsService.fetchInbox(user.id, user.settings || {});
  }

  @Get('threads')
  getThreads(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.emailsService.getThreads(user.id, page, limit);
  }

  @Get('thread')
  getThread(
    @CurrentUser() user: User,
    @Query('email') email: string,
  ) {
    return this.emailsService.getThread(user.id, email);
  }
}

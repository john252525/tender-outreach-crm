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
  getInfo(@CurrentUser() user: User) {
    return this.touchApiService.getInfo(user);
  }

  @Post('add-account')
  addAccount(
    @CurrentUser() user: User,
    @Body('login') login: string,
  ) {
    return this.touchApiService.addAccount(user, login);
  }

  @Post('set-state')
  setState(
    @CurrentUser() user: User,
    @Body('login') login: string,
    @Body('state') state: boolean,
  ) {
    return this.touchApiService.setState(user, login, state);
  }

  @Get('screenshot')
  getScreenshot(
    @CurrentUser() user: User,
    @Query('login') login: string,
  ) {
    return this.touchApiService.getScreenshot(user, login);
  }
}

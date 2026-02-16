import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SshServersService } from './ssh-servers.service';
import { SshService } from './ssh.service';
import { CreateSshServerDto } from './dto/create-ssh-server.dto';
import { SshPathDto } from './dto/ssh-path.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('SSH Servers')
@ApiBearerAuth()
@Controller('ssh-servers')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SshServersController {
  constructor(
    private readonly sshServersService: SshServersService,
    private readonly sshService: SshService,
  ) {}

  @Post()
  create(@Body() dto: CreateSshServerDto, @CurrentUser() user: User) {
    return this.sshServersService.create(dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.sshServersService.findAllByUser(user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.sshServersService.remove(id, user.id);
  }

  @Post(':id/ls')
  async listDirectory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SshPathDto,
    @CurrentUser() user: User,
  ) {
    const server = await this.sshServersService.findOneByUser(id, user.id);
    return this.sshService.listDirectory(server, dto.path);
  }

  @Post(':id/ls-recursive')
  async listRecursive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SshPathDto,
    @CurrentUser() user: User,
  ) {
    const server = await this.sshServersService.findOneByUser(id, user.id);
    const files = await this.sshService.listRecursive(server, dto.path);
    return { files };
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SshServer } from './entities/ssh-server.entity';
import { SshServersService } from './ssh-servers.service';
import { SshServersController } from './ssh-servers.controller';
import { SshService } from './ssh.service';

@Module({
  imports: [TypeOrmModule.forFeature([SshServer])],
  controllers: [SshServersController],
  providers: [SshServersService, SshService],
})
export class SshServersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailMessage } from './entities/email-message.entity';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmailMessage])],
  controllers: [EmailsController],
  providers: [EmailsService],
})
export class EmailsModule {}

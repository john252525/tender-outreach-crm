import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutreachEmailAccount } from './entities/email-account.entity';
import { OutreachLeadList } from './entities/lead-list.entity';
import { OutreachLead } from './entities/lead.entity';
import { OutreachCampaign } from './entities/campaign.entity';
import { OutreachCampaignStep } from './entities/campaign-step.entity';
import { OutreachCampaignLead } from './entities/campaign-lead.entity';
import { OutreachCampaignEmail } from './entities/campaign-email.entity';
import { OutreachService } from './outreach.service';
import { OutreachController } from './outreach.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OutreachEmailAccount,
      OutreachLeadList,
      OutreachLead,
      OutreachCampaign,
      OutreachCampaignStep,
      OutreachCampaignLead,
      OutreachCampaignEmail,
    ]),
  ],
  controllers: [OutreachController],
  providers: [OutreachService],
})
export class OutreachModule {}

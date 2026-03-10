import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OutreachCampaign } from './campaign.entity';
import { OutreachLead } from './lead.entity';

@Entity('outreach_campaign_leads')
export class OutreachCampaignLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @Column({ name: 'current_step', type: 'int', default: 0 })
  currentStep: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: 'pending' | 'in_progress' | 'completed' | 'replied' | 'bounced' | 'unsubscribed';

  @Column({ name: 'next_send_at', type: 'timestamp', nullable: true })
  nextSendAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OutreachCampaign, (c) => c.campaignLeads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: OutreachCampaign;

  @ManyToOne(() => OutreachLead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: OutreachLead;
}

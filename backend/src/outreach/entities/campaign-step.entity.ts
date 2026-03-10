import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OutreachCampaign } from './campaign.entity';

@Entity('outreach_campaign_steps')
export class OutreachCampaignStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({ name: 'step_number', type: 'int' })
  stepNumber: number;

  @Column({ type: 'varchar', nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'delay_days', type: 'int', default: 1 })
  delayDays: number;

  @Column({ name: 'delay_hours', type: 'int', default: 0 })
  delayHours: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => OutreachCampaign, (c) => c.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: OutreachCampaign;
}

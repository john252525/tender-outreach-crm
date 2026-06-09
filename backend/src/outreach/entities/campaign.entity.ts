import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OutreachCampaignStep } from './campaign-step.entity';
import { OutreachCampaignLead } from './campaign-lead.entity';
import { OutreachCampaignEmail } from './campaign-email.entity';

@Entity('outreach_campaigns')
export class OutreachCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status: 'draft' | 'active' | 'paused' | 'completed';

  @Column({ name: 'lead_list_id', type: 'uuid', nullable: true })
  leadListId: string | null;

  @Column({ name: 'daily_send_limit', type: 'int', default: 50 })
  dailySendLimit: number;

  @Column({ name: 'send_from_hour', type: 'int', default: 9 })
  sendFromHour: number;

  @Column({ name: 'send_to_hour', type: 'int', default: 18 })
  sendToHour: number;

  @Column({ type: 'varchar', default: 'Europe/Moscow' })
  timezone: string;

  @Column({ name: 'track_opens', default: false })
  trackOpens: boolean;

  @Column({ name: 'stats_sent', type: 'int', default: 0 })
  statsSent: number;

  @Column({ name: 'stats_opened', type: 'int', default: 0 })
  statsOpened: number;

  @Column({ name: 'stats_replied', type: 'int', default: 0 })
  statsReplied: number;

  @Column({ name: 'stats_bounced', type: 'int', default: 0 })
  statsBounced: number;

  // Optional link back to the tender this campaign was created from.
  // Denormalized number is kept so the campaign list can show the tender
  // reference without joining the purchases table.
  @Column({ name: 'source_purchase_id', type: 'uuid', nullable: true })
  sourcePurchaseId: string | null;

  @Column({ name: 'source_purchase_number', type: 'varchar', nullable: true })
  sourcePurchaseNumber: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OutreachCampaignStep, (step) => step.campaign)
  steps: OutreachCampaignStep[];

  @OneToMany(() => OutreachCampaignLead, (cl) => cl.campaign)
  campaignLeads: OutreachCampaignLead[];

  @OneToMany(() => OutreachCampaignEmail, (ce) => ce.campaign)
  emails: OutreachCampaignEmail[];

  // Linked email accounts (stored as JSON array of account IDs)
  @Column({ name: 'email_account_ids', type: 'jsonb', default: '[]' })
  emailAccountIds: string[];
}

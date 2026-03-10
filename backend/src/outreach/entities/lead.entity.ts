import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OutreachLeadList } from './lead-list.entity';

@Entity('outreach_leads')
export class OutreachLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'lead_list_id' })
  leadListId: string;

  @Column()
  email: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string | null;

  @Column({ name: 'last_name', nullable: true })
  lastName: string | null;

  @Column({ nullable: true })
  company: string | null;

  @Column({ nullable: true })
  website: string | null;

  @Column({ nullable: true })
  position: string | null;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true })
  customFields: Record<string, string> | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: 'active' | 'bounced' | 'unsubscribed' | 'invalid';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => OutreachLeadList, (list) => list.leads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_list_id' })
  leadList: OutreachLeadList;
}

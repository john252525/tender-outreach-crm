import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Purchase } from './purchase.entity';
import { AiSearchTerm } from './ai-search-term.entity';

@Entity('purchase_ai_results')
@Unique(['userId', 'purchaseId'])
export class PurchaseAiResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Purchase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @Column({ name: 'purchase_id' })
  purchaseId: string;

  @ManyToOne(() => AiSearchTerm, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ai_search_term_id' })
  searchTerm: AiSearchTerm | null;

  @Column({ name: 'ai_search_term_id', type: 'uuid', nullable: true })
  searchTermId: string | null;

  @Column({ type: 'text', nullable: true })
  subject: string | null;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

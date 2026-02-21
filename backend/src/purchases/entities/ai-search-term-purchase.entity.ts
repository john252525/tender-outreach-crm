import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { AiSearchTerm } from './ai-search-term.entity';
import { Purchase } from './purchase.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ai_search_term_purchases')
@Unique(['searchTermId', 'purchaseId', 'userId'])
export class AiSearchTermPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AiSearchTerm, (st) => st.purchases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ai_search_term_id' })
  searchTerm: AiSearchTerm;

  @Column({ name: 'ai_search_term_id' })
  searchTermId: string;

  @ManyToOne(() => Purchase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @Column({ name: 'purchase_id' })
  purchaseId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

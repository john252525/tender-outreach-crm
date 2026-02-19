import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Purchase } from './purchase.entity';

@Entity('user_purchase_history')
export class UserPurchaseHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Purchase, (purchase) => purchase.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @Column({ name: 'purchase_id' })
  purchaseId: string;

  @Column({ name: 'search_query', type: 'text', nullable: true })
  searchQuery: string | null;

  @Column({ name: 'found_at', type: 'timestamp', default: () => 'now()' })
  foundAt: Date;
}

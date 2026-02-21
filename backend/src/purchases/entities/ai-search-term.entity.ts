import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AiSearchTermPurchase } from './ai-search-term-purchase.entity';

@Entity('ai_search_terms')
export class AiSearchTerm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  term: string;

  @OneToMany(() => AiSearchTermPurchase, (stp) => stp.searchTerm)
  purchases: AiSearchTermPurchase[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

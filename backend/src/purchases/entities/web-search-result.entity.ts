import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WebSearchResultSearchTerm } from './web-search-result-search-term.entity';
import { WebSearchResultEmail } from './web-search-result-email.entity';

@Entity('web_search_results')
@Unique(['url', 'userId'])
export class WebSearchResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', default: '' })
  title: string;

  @Column({ type: 'text', default: '' })
  snippet: string;

  @Column({ type: 'text', default: '' })
  favicon: string;

  @OneToMany(() => WebSearchResultSearchTerm, (wst) => wst.webSearchResult)
  searchTermLinks: WebSearchResultSearchTerm[];

  @OneToMany(() => WebSearchResultEmail, (wse) => wse.webSearchResult)
  emailLinks: WebSearchResultEmail[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { WebSearchResult } from './web-search-result.entity';
import { AiSearchTerm } from './ai-search-term.entity';

@Entity('web_search_result_search_terms')
@Unique(['webSearchResultId', 'searchTermId'])
export class WebSearchResultSearchTerm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WebSearchResult, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'web_search_result_id' })
  webSearchResult: WebSearchResult;

  @Column({ name: 'web_search_result_id' })
  webSearchResultId: string;

  @ManyToOne(() => AiSearchTerm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ai_search_term_id' })
  searchTerm: AiSearchTerm;

  @Column({ name: 'ai_search_term_id' })
  searchTermId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

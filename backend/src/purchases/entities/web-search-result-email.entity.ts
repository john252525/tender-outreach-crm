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
import { ParsedEmail } from './parsed-email.entity';

@Entity('web_search_result_emails')
@Unique(['webSearchResultId', 'parsedEmailId'])
export class WebSearchResultEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WebSearchResult, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'web_search_result_id' })
  webSearchResult: WebSearchResult;

  @Column({ name: 'web_search_result_id' })
  webSearchResultId: string;

  @ManyToOne(() => ParsedEmail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parsed_email_id' })
  parsedEmail: ParsedEmail;

  @Column({ name: 'parsed_email_id' })
  parsedEmailId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

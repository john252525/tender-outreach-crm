import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { WebSearchResultEmail } from './web-search-result-email.entity';

@Entity('parsed_emails')
export class ParsedEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email: string;

  @OneToMany(() => WebSearchResultEmail, (wse) => wse.parsedEmail)
  webSearchResultEmails: WebSearchResultEmail[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

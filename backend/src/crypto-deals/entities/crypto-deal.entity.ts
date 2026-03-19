import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CryptoSource } from './crypto-source.entity';

@Entity('crypto_deals')
export class CryptoDeal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_id' })
  sourceId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ name: 'sender_ip', type: 'varchar', nullable: true })
  senderIp: string | null;

  @ManyToOne(() => CryptoSource, (source) => source.deals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_id' })
  source: CryptoSource;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

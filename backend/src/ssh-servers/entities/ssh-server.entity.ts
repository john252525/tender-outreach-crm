import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../users/entities/user.entity';

@Entity('ssh_servers')
export class SshServer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  host: string;

  @Column({ default: 22 })
  port: number;

  @Column()
  username: string;

  @Column({ name: 'encrypted_password', type: 'text', nullable: true })
  @Exclude()
  encryptedPassword: string | null;

  @Column({ name: 'encrypted_private_key', type: 'text', nullable: true })
  @Exclude()
  encryptedPrivateKey: string | null;

  @Column({ name: 'auth_type', default: 'password' })
  authType: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

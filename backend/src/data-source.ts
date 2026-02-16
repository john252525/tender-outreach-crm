import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { SshServer } from './ssh-servers/entities/ssh-server.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DATABASE_URL ? undefined : (process.env.DB_USERNAME || 'postgres'),
  password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'postgres'),
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'admin_panel'),
  entities: [User, SshServer],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

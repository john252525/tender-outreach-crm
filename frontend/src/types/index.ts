export enum Role {
  ADMIN = 'admin',
  DIRECTOR = 'director',
  MANAGER = 'manager',
  SUPPORT = 'support',
  SELLER = 'seller',
  MARKETER = 'marketer',
  CLIENT = 'client',
  PARTNER = 'partner',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Администратор',
  [Role.DIRECTOR]: 'Директор',
  [Role.MANAGER]: 'Менеджер',
  [Role.SUPPORT]: 'Техподдержка',
  [Role.SELLER]: 'Продавец',
  [Role.MARKETER]: 'Маркетолог',
  [Role.CLIENT]: 'Клиент',
  [Role.PARTNER]: 'Партнёр',
};

export type ThemeVariant = 'classic' | 'modern';
export type ColorMode = 'light' | 'dark';

export interface UserSettings {
  theme?: ThemeVariant;
  colorMode?: ColorMode;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  settings?: UserSettings | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'settings'>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface SshServer {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'key';
  createdAt: string;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
}

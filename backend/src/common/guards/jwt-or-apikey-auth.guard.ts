import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class JwtOrApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Необходима авторизация');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Неверный формат авторизации');
    }

    // API key auth
    if (token.startsWith('oak_')) {
      const apiKey = await this.apiKeysService.validateKey(token);
      if (!apiKey) {
        throw new UnauthorizedException('Недействительный API ключ');
      }
      request.user = apiKey.user;
      return true;
    }

    // JWT auth
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Пользователь не найден или деактивирован');
      }
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Недействительный токен');
    }
  }
}

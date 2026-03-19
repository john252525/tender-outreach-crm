import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

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

    // Check if it's an API key (starts with "oak_")
    if (token.startsWith('oak_')) {
      const apiKey = await this.apiKeysService.validateKey(token);
      if (!apiKey) {
        throw new UnauthorizedException('Недействительный API ключ');
      }
      request.user = apiKey.user;
      return true;
    }

    // Not an API key - let it fall through (will be handled by JWT guard)
    return true;
  }
}

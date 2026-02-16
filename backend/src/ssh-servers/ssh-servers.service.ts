import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SshServer } from './entities/ssh-server.entity';
import { CreateSshServerDto } from './dto/create-ssh-server.dto';
import { CryptoUtil } from './utils/crypto.util';

@Injectable()
export class SshServersService {
  constructor(
    @InjectRepository(SshServer)
    private readonly sshServerRepository: Repository<SshServer>,
  ) {}

  async create(dto: CreateSshServerDto, userId: string): Promise<SshServer> {
    const server = this.sshServerRepository.create({
      name: dto.name,
      host: dto.host,
      port: dto.port || 22,
      username: dto.username,
      authType: dto.authType,
      encryptedPassword: dto.password
        ? CryptoUtil.encrypt(dto.password)
        : null,
      encryptedPrivateKey: dto.privateKey
        ? CryptoUtil.encrypt(dto.privateKey)
        : null,
      userId,
    });

    return this.sshServerRepository.save(server);
  }

  async findAllByUser(userId: string): Promise<SshServer[]> {
    return this.sshServerRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByUser(id: string, userId: string): Promise<SshServer> {
    const server = await this.sshServerRepository.findOne({
      where: { id },
    });

    if (!server) {
      throw new NotFoundException('SSH сервер не найден');
    }

    if (server.userId !== userId) {
      throw new ForbiddenException('Нет доступа к этому серверу');
    }

    return server;
  }

  async remove(id: string, userId: string): Promise<void> {
    const server = await this.findOneByUser(id, userId);
    await this.sshServerRepository.remove(server);
  }
}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable({})
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signJwtToken(userId: number, userName: string): Promise<string> {
    const payload = {
      sub: userId,
      userName,
    };
    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn: 24 * 3600, // 24 hours
      secret: await this.getSecretFromDatabase(),
    });

    return jwtString;
  }

  private async getSecretFromDatabase() {
    const config = await this.prismaService.key.findFirst({
      where: { name: 'JWT_SECRET' },
    });
    return config.key;
  }
}

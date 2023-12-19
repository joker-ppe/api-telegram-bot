import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private jwtSecret: string;

  constructor(public prismaService: PrismaService) {
    super({
      // token string is added to every request(except login/register)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        if (!this.jwtSecret) {
          // Fetch secret from database
          const secret = await this.getSecretFromDatabase();
          this.jwtSecret = secret;
        }
        done(null, this.jwtSecret);
      },
    });
  }
  async validate(payload: { sub: number; email: string }) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    delete user.hashedPassword;
    return user;
  }

  private async getSecretFromDatabase() {
    const config = await this.prismaService.key.findFirst({
      where: { name: 'JWT_SECRET' },
    });
    return config.key;
  }
}

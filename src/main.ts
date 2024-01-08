import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DateTime } from 'luxon';
import { Request, Response, NextFunction } from 'express';

function extractIPv4(ipv6) {
  const ipv4Regex = /::ffff:(\d+\.\d+\.\d+\.\d+)/;
  const match = ipv6.match(ipv4Regex);
  return match ? match[1] : ipv6;
}

@Injectable()
export class IpWhitelistMiddleware implements NestMiddleware {
  private readonly whitelist = [
    '188.166.208.190',
    '3.1.5.108',
    '13.215.248.115',
    '::1',
  ]; // Thay thế với danh sách IP của bạn

  use(req: Request, res: Response, next: NextFunction) {
    const rawIp = req.ip || req.socket.remoteAddress;
    const requestIp = extractIPv4(rawIp);
    if (!this.whitelist.includes(requestIp)) {
      console.log(`IP ${requestIp} not allowed.`);
      throw new HttpException(
        `IP ${requestIp} not allowed.`,
        HttpStatus.FORBIDDEN,
      );
    }
    next();
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Setup IP Whitelist Middleware
  app.use(new IpWhitelistMiddleware().use.bind(new IpWhitelistMiddleware()));
  // add middleware HERE!
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Telegram Bot API')
    .setDescription('by Joker')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Lấy thông tin commit date từ route git-info/commit-date
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const git = require('git-last-commit');

  git.getLastCommit(function (err, commit) {
    // read commit object properties
    // console.log(err);
    // console.log(commit);

    const unixTimestamp = commit['committedOn']; // Replace with your timestamp
    const date = DateTime.fromMillis(unixTimestamp * 1000, {
      zone: 'Asia/Ho_Chi_Minh',
    });

    const formattedDate = date.toFormat('dd/MM/yyyy, HH:mm:ss');

    console.log(formattedDate);

    document.info.description += ` - Last Commit Time: ${formattedDate}`;
    document.info.version += ` - ${commit['shortHash']}`;
  });

  SwaggerModule.setup('docs', app, document);

  await app.listen(3004);
}
bootstrap();

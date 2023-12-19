import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DateTime } from 'luxon';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

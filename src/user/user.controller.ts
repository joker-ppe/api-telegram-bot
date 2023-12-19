import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from '../auth/decorator/user.decorator';
// import { AuthGuard } from '@nestjs/passport';
import { MyJwtGuard } from '../auth/guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  //   @UseGuards(AuthGuard('jwt'))
  @UseGuards(MyJwtGuard)
  @Get('profile')
  me(@GetUser() user: User) {
    return user;
  }
}

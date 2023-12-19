import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  userName: string;

  // @IsEmail()
  // @IsOptional()
  // @ApiProperty()
  // email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}

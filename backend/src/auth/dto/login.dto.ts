import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'keith@farmreturn.ie' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

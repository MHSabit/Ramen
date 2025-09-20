import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../common/repository/user/user.repository';

export class LoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  tokenExpires: Date;

  @ApiProperty()
  user: User;
}
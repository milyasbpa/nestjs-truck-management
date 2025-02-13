import {
  Body,
  Controller,
  Get,
  Headers, HttpCode, HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthPayloadDto, AuthResponseDto } from './dto/auth.dto';
import { LocalGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { UserService } from '../service/user.service';

@Controller('auth')
export class AuthController {
  constructor(private userService: UserService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalGuard)
  async login(@Body() req: AuthPayloadDto): Promise<AuthResponseDto> {
    return await this.userService.validateFamousUser(req);
  }

  @Get('get-token')
  @HttpCode(HttpStatus.OK)
  async getToken(
    @Headers('x-access-token') headers: string,
  ): Promise<AuthResponseDto> {
    return await this.userService.validateUserFromToken(headers);
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  status() {
    return {
      status: 'authenticated',
    };
  }
}

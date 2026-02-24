import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() payload: unknown): string {
    // TODO: implementar
    return this.authService.register(payload);
  }

  @Post('login')
  login(@Body() payload: unknown): string {
    // TODO: implementar
    return this.authService.login(payload);
  }
}

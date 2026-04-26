import { Body, Controller, Get, Post, Req, UseFilters, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() payload: RegisterDto) {
    const result = await this.authService.register(payload);
    return { success: true, data: result, message: 'Registration successful.' };
  }

  @Post('login')
  async login(@Body() payload: LoginDto) {
    const result = await this.authService.login(payload);
    return { success: true, data: result, message: 'Login successful.' };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: Request) {
    const user = req.user as any;
    const result = await this.authService.refreshTokens(user.sub, user.email);
    return { success: true, data: result, message: 'Token refreshed.' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    const user = req.user as any;
    await this.authService.logout(user.sub);
    return { success: true, data: null, message: 'Logged out successfully.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const user = req.user as any;
    const profile = await this.authService.getProfile(user.sub);
    return { success: true, data: profile, message: 'Profile loaded.' };
  }
}

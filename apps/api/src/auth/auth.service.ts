import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(payload: RegisterDto) {
    const existing = await this.userModel.findOne({ email: payload.email }).lean().exec();
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.userModel.create({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      provider: 'local',
      agreedToTerms: payload.agreedToTerms ?? false,
      agreedToTermsAt: payload.agreedToTerms ? new Date() : undefined,
    });

    const tokens = await this.getTokenPair(user._id.toString(), user.email);
    await this.usersService.setRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    };
  }

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmailWithSecrets(payload.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await user.comparePassword(payload.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.getTokenPair(user._id.toString(), user.email);
    await this.usersService.setRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    };
  }

  async refreshTokens(userId: string, email: string) {
    const user = await this.usersService.findByIdWithSecrets(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tokens = await this.getTokenPair(userId, email);
    await this.usersService.setRefreshToken(userId, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      }
    };
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async getTokenPair(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET') || 'access-secret',
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m'
      }
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d'
      }
    );

    return { accessToken, refreshToken };
  }
}

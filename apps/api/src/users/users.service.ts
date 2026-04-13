import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).lean().exec();
  }

  async findByEmailWithSecrets(email: string) {
    return this.userModel.findOne({ email }).select('+password +refreshToken').exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-password -refreshToken').lean().exec();
  }

  async findByIdWithSecrets(id: string) {
    return this.userModel.findById(id).select('+password +refreshToken').exec();
  }

  async setRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 12);
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashed }).exec();
  }

  async removeRefreshToken(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null }).exec();
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from '../auth/register.dto';
import { UpdateUserDto } from './update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
        phoneNumber: dto.phoneNumber,
        role: 'USER',
        userName: dto.userName,
        country: dto.country,
        image: dto.image,
      },
    });

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userName: true,
        country: true,
        image: true,
        role: true,
        isSubscribed: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getUserProfile(user: any) {
    const userId = user?.id;
    if (!userId) {
      throw new NotFoundException('Invalid or missing user ID');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userName: true,
        country: true,
        image: true,
        role: true,
        isSubscribed: true,
        createdAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    return existing;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const {
      fullName,
      phoneNumber,
      userName,
      country,
      image
    } = dto;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName }),
        ...(phoneNumber && { phoneNumber }),
        ...(userName && { userName }),
        ...(country && { country }),
        ...(image && { image }),
      },
    });

    return updatedUser;
  }

  async updateProfileImage(userId: string, imageUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });
  }
}

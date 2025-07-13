// src/main/profile/profile.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(user: any) {
    const userId = user?.id;
  
    if (!userId) {
      throw new NotFoundException('Invalid or missing user ID');
    }
  
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
  
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
  
    return profile;
  }
}

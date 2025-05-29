/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  UseGuards,
  Patch,
  Body,
  Req,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateUserDto } from './update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { cloudinaryStorage } from 'src/config/cloudinary.storage';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth('access-token') 
  @Get('all')
  async getAllUsers() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Patch('update-profile')
  async updateProfile(@Req() req, @Body() dto: UpdateUserDto) {
    const userId = req.user.id;
    return this.userService.updateProfile(userId, dto);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @Post('upload-profile-image')
  @UseInterceptors(FileInterceptor('file', { storage: cloudinaryStorage }))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    // console.log('Decoded JWT user:', req.user);
    const userId = req.user.id;
    const imageUrl = file.path;
    return this.userService.updateProfileImage(userId, imageUrl);
  }
}

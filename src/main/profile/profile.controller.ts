// import {
//   Controller,
//   Get,
//   Patch,
//   UseGuards,
//   Req,
//   Body,
//   Post,
// } from '@nestjs/common';
// import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
// import { ProfileService } from './profile.service';
// import { ApiBearerAuth } from '@nestjs/swagger';

// @Controller('profile')
// // @UseGuards(JwtAuthGuard)
// export class ProfileController {
//   constructor(private readonly profileService: ProfileService) {}

//   @Get('me')
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth('access-token')
//   getMyProfile(@Req() req: any) {
//     console.log('🔐 JWT Payload:', req.user);
//     return this.profileService.getMyProfile(req.user);
//   }
// }

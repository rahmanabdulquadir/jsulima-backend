

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/* eslint-disable prettier/prettier */

import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name of the user' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'johnny123', description: 'Username of the user' })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ example: '+8801234567890', description: 'Phone number of the user' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Bangladesh', description: 'Country of the user' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'https://example.com/profile.jpg', description: 'Profile image URL' })
  @IsOptional()
  @IsString()
  image?: string;
}

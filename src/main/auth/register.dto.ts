import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'johndoe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '017XXXXXXXX' })
  @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  userName?: string;

  @IsOptional()
  country?: string;

  @IsOptional()
  image?: string;
}



// export class VerifyRegisterOtpDto {
//   @ApiProperty({ example: 'John Doe' })
//   @IsNotEmpty()
//   fullName: string;

//   @ApiProperty({ example: 'johndoe@example.com' })
//   @IsEmail()
//   email: string;

//   @ApiProperty({ example: 'password123' })
//   @IsNotEmpty()
//   @MinLength(6)
//   password: string;

//   @ApiProperty({ example: '017XXXXXXXX' })
//   @IsNotEmpty()
//   phoneNumber: string;

//   @IsOptional()
//   userName?: string;

//   @IsOptional()
//   country?: string;

//   @IsOptional()
//   image?: string;
// }
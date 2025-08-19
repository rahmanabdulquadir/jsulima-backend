import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './register.dto';
import { LoginDto } from './login.dto';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { ChangePasswordDto } from './forget-password.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {
    // Log the JWT_SECRET value to ensure it's being read correctly
    const jwtSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!jwtSecret) {
      // console.error('JWT_SECRET is not defined!');
      throw new Error('JWT_SECRET is not defined in the environment variables.');
    }
    // console.log('JWT_SECRET inside AuthService:', jwtSecret);
  }


  // async register(dto: RegisterDto) {
  //   const existing = await this.usersService.findByEmail(dto.email);
  //   if (existing) throw new ForbiddenException('Email already exists');
  //   const user = await this.usersService.createUser(dto);
  //   const tokens = await this.generateTokens(user);
  //   return { user, ...tokens };
  // }


  async registerWithOtp(dto: RegisterDto) {
  await this.verifyOtp(dto.email,dto.otp, 'register');

  const existing = await this.usersService.findByEmail(dto.email);
  if (existing) throw new ForbiddenException('Email already exists');

  const user = await this.usersService.createUser(dto);
  const tokens = await this.generateTokens(user);
  return { user, ...tokens };
}


  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // console.log("previous user", user)
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    const payload = { sub: user.id, role: user.role };
  
    const jwtSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables.');
    }
  
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
    });
  
    const updatedUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isSubscribed: true,
      },
    });
    // console.log('✅ User fetched in login:', updatedUser);

  
    return { access_token: accessToken, user: updatedUser };
  }
  

  async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.usersService.findByEmail(payload.email);
      return this.generateTokens(user);
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }




async resetPassword(email: string, newPassword: string) {
  const record = await this.prisma.otpVerification.findFirst({
    where: { email, type: 'reset-password', isVerified: true },
  });

  if (!record) {
    throw new UnauthorizedException('You must verify OTP before resetting password');
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await this.prisma.user.update({
    where: { email },
    data: { password: hashed },
  });

  // cleanup
  await this.prisma.otpVerification.delete({ where: { id: record.id } });

  return { message: 'Password has been reset successfully' };
}




  async changePassword(userId: string, dto: ChangePasswordDto) {
    // console.log('DTO:', dto);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
  
    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');
  
    if (dto.newPassword !== dto.retypeNewPassword) {
      throw new BadRequestException('New passwords do not match');
    }
  
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  

    return { message: 'Password changed successfully' };
  }




async generateOtp(email: string, type: 'register' | 'reset-password') {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await this.prisma.otpVerification.create({
    data: { email, otp, type, expiresAt,isVerified:false}, // add field
  });

  await this.mailerService.sendMail({
    to: email,
    subject: `Your ${type === 'register' ? 'Registration' : 'Reset Password'} OTP`,
    html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
  });

  return { message: 'OTP sent to email' };
}




async verifyOtp(email: string, otp: string, type: 'register' | 'reset-password') {
  const record = await this.prisma.otpVerification.findFirst({
    where: { email, otp, type },
  });

  if (!record || new Date() > new Date(record.expiresAt)) {
    throw new BadRequestException('OTP is invalid or expired');
  }

  // Delete OTP after verification
  await this.prisma.otpVerification.delete({ where: { id: record.id } });

  return true;
}



async verifyResetOtp(email: string, otp: string) {
  const record = await this.prisma.otpVerification.findFirst({
    where: { email, otp, type: 'reset-password' },
  });

  if (!record || new Date() > record.expiresAt) {
    throw new BadRequestException('OTP is invalid or expired');
  }

  // mark as verified instead of deleting
  await this.prisma.otpVerification.update({
    where: { id: record.id },
    data: { isVerified: true },
  });

  return { message: 'OTP verified, you can now reset your password' };
}



}

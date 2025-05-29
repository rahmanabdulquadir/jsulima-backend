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
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MailerService } from '@nestjs-modules/mailer';
import { ChangePasswordDto } from './forget-password.dto';

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


  async register(dto: RegisterDto) {
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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new BadRequestException('User not found');

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt: expires,
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset',
      html: `<p>Click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    });

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (
      !resetRecord ||
      new Date() > new Date(resetRecord.expiresAt)
    ) {
      throw new BadRequestException('Token is invalid or expired');
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashed },
    });

    await this.prisma.passwordResetToken.delete({ where: { token } });

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
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
}

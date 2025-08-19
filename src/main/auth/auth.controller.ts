import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './register.dto';
import { LoginDto } from './login.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ChangePasswordDto,

} from './forget-password.dto';
import { RequestWithUser } from 'src/common/types/request-with-user';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

 @Post('register/send-otp')
  @ApiOperation({ summary: 'Send OTP for registration' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' } } } })
  async sendRegisterOtp(@Body('email') email: string) {
    return this.authService.generateOtp(email, 'register');
  }

@Post('register/verify-otp')
  @ApiOperation({ summary: 'Verify OTP and complete registration' })
  @ApiBody({ type: RegisterDto })
async verifyRegisterOtp(@Body() dto: RegisterDto) {
  return this.authService.registerWithOtp(dto);
}

 // 1️⃣ Send OTP
  @Post('reset-password/send-otp')
  @ApiOperation({ summary: 'Send OTP for password reset' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string', example: 'user@example.com' } } } })
  @ApiResponse({ status: 201, description: 'OTP sent to email' })
  async sendResetOtp(@Body('email') email: string) {
    return this.authService.generateOtp(email, 'reset-password');
  }

  // 2️⃣ Verify OTP
  @Post('reset-password/verify-otp')
  @ApiOperation({ summary: 'Verify OTP for password reset' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        otp: { type: 'string', example: '1234' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'OTP is invalid or expired' })
  async verifyResetOtp(@Body() dto: { email: string; otp: string }) {
    return this.authService.verifyResetOtp(dto.email, dto.otp);
  }

  // 3️⃣ Reset password
  @Post('reset-password/confirm')
  @ApiOperation({ summary: 'Confirm password reset after OTP verification' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        newPassword: { type: 'string', example: 'NewSecurePass123!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Password has been reset successfully' })
  @ApiResponse({ status: 400, description: 'OTP verification required before resetting password' })
  async confirmResetPassword(
    @Body() dto: { email: string; newPassword: string },
  ) {
    return this.authService.resetPassword(dto.email, dto.newPassword);
  }





  @Post('login')
  @ApiBody({ type: LoginDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }



  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth('access-token')
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    // console.log('Request user:', req.user); 
    return this.authService.changePassword(req.user.id, dto);
  }
  
}

import { Controller, Post, Body, UseGuards, Req, UnauthorizedException, Get, Param } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { CreateCheckoutDto } from './create-checkout.dto';

import { Request } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('payment')
export class BillingController {
  constructor(private stripeService: StripeService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(@Req() req: Request, @Body() body: CreateCheckoutDto) {
    const { planId, amount, promoCode } = body;
    const userId = req.user?.id; // extracted from auth token

    if (!userId) {
      throw new UnauthorizedException();
    }
    const successUrl = 'http://localhost:3000/success';
    const cancelUrl = 'http://localhost:3000/cancel';

    const url = await this.stripeService.createCheckoutSession({
      userId,
      planId,
      promoCode,
      amount,
      successUrl,
      cancelUrl,
    });

    return { url };
  }

  @Get('details/:sessionId')
  async getPaymentDetails(@Param('sessionId') sessionId: string) {
    return this.stripeService.getCheckoutSessionDetails(sessionId);
  }
}

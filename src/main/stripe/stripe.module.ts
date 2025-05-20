import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PromoCodeModule } from '../promo-code/promo-code.module';

@Module({
  imports: [PromoCodeModule,],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}

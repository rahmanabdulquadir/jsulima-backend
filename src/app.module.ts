import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './main/auth/auth.module';
import { UserModule } from './main/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './main/auth/strategies/jwt.strategy';
import { PlanModule } from './main/plan/plan.module';
import { PromoCodeModule } from './main/promo-code/promo-code.module';
import { SubscriptionModule } from './main/subscription/subscription.module';
import { DashboardService } from './main/dashboard/dashboard.service';
import { DashboardController } from './main/dashboard/dashboard.controller';
import { DashboardModule } from './main/dashboard/dashboard.module';
import { StripeService } from './main/stripe/stripe.service';
import { StripeModule } from './main/stripe/stripe.module';
import { BillingModule } from './main/billing/billing.module';
import { StripeController } from './main/stripe/stripe.controller';

import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
  imports: [
    PassportModule,
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: `"Your App Name" <${configService.get('EMAIL_USER')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    PlanModule,
    PromoCodeModule,
    PrismaModule,
    SubscriptionModule,
    DashboardModule,
    BillingModule,
    StripeModule,
  ],
  controllers: [AppController, DashboardController, StripeController],
  providers: [
    AppService,
    PrismaService,
    JwtStrategy,
    DashboardService,
    StripeService,
  ],
})
export class AppModule {}

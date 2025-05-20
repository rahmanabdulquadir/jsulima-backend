// // import { Injectable } from '@nestjs/common';

// // @Injectable()
// // export class BillingService {}







// import { Injectable } from '@nestjs/common';
// import Stripe from 'stripe';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class BillingService {
//   private stripe: Stripe;

//   constructor(private configService: ConfigService) {
//     const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
//     if (!stripeSecretKey) {
//       throw new Error('STRIPE_SECRET_KEY is not defined in the environment variables');
//     }
  
//     this.stripe = new Stripe(stripeSecretKey, {
//         apiVersion: '2025-04-30.basil',
//     });
//   }
//   async createCheckoutSession({
//     userId,
//     planId,
//     amount,
//     successUrl,
//     cancelUrl,
//   }: {
//     userId: string;
//     planId: string;
//     amount: number;
//     successUrl: string;
//     cancelUrl: string;
//   }) {
//     const session = await this.stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             product_data: {
//               name: `Subscription for Plan ID: ${planId}`,
//             },
//             unit_amount: amount * 100, // in cents
//           },
//           quantity: 1,
//         },
//       ],
//       mode: 'payment',
//       success_url: successUrl,
//       cancel_url: cancelUrl,
//       metadata: {
//         userId,
//         planId,
//       },
//     });

//     return session.url;
//   }

//   async constructWebhookEvent(payload: Buffer, signature: string) {
//     const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
  
//     if (!endpointSecret) {
//       throw new Error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
//     }
//     console.log(signature)
  
//     return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
//   }
// }

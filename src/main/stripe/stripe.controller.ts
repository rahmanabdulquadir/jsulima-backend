import { Controller, Post, Headers, Req, Res } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';

@Controller('webhook/stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async handleWebhook(
    @Req() request: Request,
    @Res() response: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    // console.log('⚡ Webhook route hit');
    // console.log('📝 Raw request body:', JSON.stringify(request.body, null, 2));

    let event: Stripe.Event;

    try {
      event = await this.stripeService.constructWebhookEvent(
        request.body,
        signature,
      );
      // console.log('✅ Stripe Webhook Event constructed successfully!');
      // console.log('📦 Event Type:', event.type);
      // console.log('📦 Full Event:', JSON.stringify(event, null, 2));
    } catch (err) {
      console.error('❌ Webhook signature verification failed.', err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      // console.log('🎯 Handling checkout.session.completed event...');
      const session = event.data.object as Stripe.Checkout.Session;
      // console.log('📄 Session Payload:', JSON.stringify(session, null, 2));

      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId;
      const paymentIntentId = session.payment_intent as string;

      // console.log('🔍 Extracted Metadata:');
      // console.log('   userId:', userId, '| typeof:', typeof userId);
      // console.log('   planId:', planId);
      // console.log('   paymentIntentId:', paymentIntentId);

      if (!userId || !planId || !paymentIntentId) {
        console.warn('⚠️ Missing metadata in session. Skipping.');
        return response.status(400).send('Missing metadata');
      }

      try {
        const existing = await this.prisma.userSubscription.findFirst({
          where: { paymentIntentId },
        });

        if (existing) {
          console.log('ℹ️ Subscription already exists. Skipping duplicate.');
          return response.status(200).send('Duplicate event handled');
        }

        // Try fetching payment intent and invoice
        let invoiceUrl: string | null = null;
        try {
          const paymentIntent = await this.stripeService.getPaymentIntent(paymentIntentId);
          const charge = paymentIntent?.charges?.data?.[0];
          if (charge?.invoice && typeof charge.invoice === 'string') {
            const invoice = await this.stripeService.getInvoice(charge.invoice);
            invoiceUrl = invoice?.hosted_invoice_url || null;
          }
          // console.log('🧾 Invoice URL:', invoiceUrl);
        } catch (err) {
          console.error('❌ Failed to fetch invoice:', err.message);
        }

        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        console.log('🚀 Starting DB transaction...');
        const result = await this.prisma.$transaction([
          this.prisma.userSubscription.create({
            data: {
              userId,
              planId,
              endDate,
              paymentStatus: PaymentStatus.PAID,
              paymentIntentId,
              paymentMethod: 'card',
              paidAt: new Date(),
              invoiceUrl,
            },
          }),
          this.prisma.user.update({
            where: { id: userId },
            data: { isSubscribed: true },
          }),
        ]);

        console.log('✅ Transaction completed successfully.');
        console.log('📦 Transaction result:', JSON.stringify(result, null, 2));

        const updatedUser = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        console.log('🧠 Updated user isSubscribed:', updatedUser?.isSubscribed);
        console.log('✅ User subscription created and user updated:', userId);

      } catch (error) {
        console.error('❌ Failed to save subscription:', error.message);
        return response.status(500).send('Failed to save subscription');
      }
    } else {
      // Catch-all for any other event types for now
      console.log('📌 Received unhandled event type:', event.type);
    }

    return response.status(200).send('Webhook received');
  }
}

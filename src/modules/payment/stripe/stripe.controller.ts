import { Controller, Post, Req, Headers, Body, UseGuards, Get, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { OrderItemRepository } from '../../../common/repository/order-item/order-item.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('payment/stripe')
@UseInterceptors(ClassSerializerInterceptor)
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}


  @Post('create-payment')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @GetUser('userId') userId: string,
  ) {
    try {
      const session = await this.stripeService.createPayment({
        ...createPaymentDto,
        userId,
      });
      return {
        success: true,
        message: 'Payment session created successfully',
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getUserTransactions(@GetUser('userId') userId: string) {
    try {
      const transactions = await TransactionRepository.getTransactionsByUserId(userId);
      return {
        success: true,
        message: 'User transactions fetched successfully',
        data: transactions,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('transactions/successful')
  @UseGuards(JwtAuthGuard)
  async getUserSuccessfulTransactions(@GetUser('userId') userId: string) {
    try {
      const transactions = await TransactionRepository.getSuccessfulTransactionsByUserId(userId);
      return {
        success: true,
        message: 'User successful transactions fetched successfully',
        data: transactions,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('purchases')
  @UseGuards(JwtAuthGuard)
  async getUserPurchases(@GetUser('userId') userId: string) {
    try {
      const purchases = await OrderItemRepository.getOrderItemsByUserId(userId);
      return {
        success: true,
        message: 'User purchases fetched successfully',
        data: purchases,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('purchases/successful')
  @UseGuards(JwtAuthGuard)
  async getUserSuccessfulPurchases(@GetUser('userId') userId: string) {
    try {
      const purchases = await OrderItemRepository.getSuccessfulOrderItemsByUserId(userId);
      return {
        success: true,
        message: 'User successful purchases fetched successfully',
        data: purchases,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('transaction/:transactionId/items')
  @UseGuards(JwtAuthGuard)
  async getTransactionItems(
    @GetUser('userId') userId: string,
    @Req() req: Request,
  ) {
    try {
      const transactionId = req.params.transactionId;
      
      // Verify the transaction belongs to the user
      const transaction = await TransactionRepository.getTransactionByReference(transactionId);
      if (!transaction || transaction.user_id !== userId) {
        return {
          success: false,
          message: 'Transaction not found or access denied',
          data: null,
        };
      }

      const items = await OrderItemRepository.getOrderItemsByTransactionId(transactionId);
      return {
        success: true,
        message: 'Transaction items fetched successfully',
        data: items,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('products')
  @UseGuards(JwtAuthGuard)
  async getAvailableProducts() {
    try {
      const products = await this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          category: true,
          spice_level: true,
          popular: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        message: 'Available products fetched successfully',
        data: products,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    try {
      // Validate signature presence
      if (!signature) {
        // console.error('Missing Stripe signature');
        return { received: false, error: 'Missing signature' };
      }

      const payload = req.rawBody?.toString();
      if (!payload) {
        // console.error('Missing webhook payload');
        return { received: false, error: 'Missing payload' };
      }

      const event = await this.stripeService.handleWebhook(payload, signature);

      // Handle events
      switch (event.type) {
        case 'customer.created':
          break;
        case 'checkout.session.completed':
          const session = event.data.object;
          // console.log('Checkout session completed:', session.id);
          
          // Check if transaction already processed (idempotency)
          const existingTransaction = await TransactionRepository.getTransactionByReference(session.id);
          if (existingTransaction && existingTransaction.status === 'succeeded') {
            // console.log('Transaction already processed:', session.id);
            break;
          }
          
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: session.id,
            status: 'succeeded',
            paid_amount: session.amount_total / 100, // amount in dollars
            paid_currency: session.currency,
            raw_status: session.payment_status,
          });
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          // console.log('Payment intent succeeded:', paymentIntent.id);
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: paymentIntent.id,
            status: 'succeeded',
            paid_amount: paymentIntent.amount / 100, // amount in dollars
            paid_currency: paymentIntent.currency,
            raw_status: paymentIntent.status,
          });
          break;
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
          // console.log('Payment intent failed:', failedPaymentIntent.id);
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: failedPaymentIntent.id,
            status: 'failed',
            raw_status: failedPaymentIntent.status,
          });
          break;
        case 'payment_intent.canceled':
          const canceledPaymentIntent = event.data.object;
          // console.log('Payment intent canceled:', canceledPaymentIntent.id);
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: canceledPaymentIntent.id,
            status: 'canceled',
            raw_status: canceledPaymentIntent.status,
          });
          break;
        case 'payment_intent.requires_action':
          const requireActionPaymentIntent = event.data.object;
          // console.log('Payment intent requires action:', requireActionPaymentIntent.id);
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: requireActionPaymentIntent.id,
            status: 'requires_action',
            raw_status: requireActionPaymentIntent.status,
          });
          break;
        case 'payout.paid':
          const paidPayout = event.data.object;
          // console.log(paidPayout);
          break;
        case 'payout.failed':
          const failedPayout = event.data.object;
          // console.log(failedPayout);
          break;
        default:
          // console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      // console.error('Webhook error', error);
      return { received: false };
    }
  }
}

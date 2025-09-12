import { Controller, Post, Req, Headers, Body, UseGuards, Get } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { OrderItemRepository } from '../../../common/repository/order-item/order-item.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('payment/stripe')
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
      const payload = req.rawBody.toString();
      const event = await this.stripeService.handleWebhook(payload, signature);

      // Handle events
      switch (event.type) {
        case 'customer.created':
          break;
        case 'payment_intent.created':
          break;
        case 'payment_intent.succeeded':
          console.log('payment_intent.succeeded');
          const paymentIntent = event.data.object;
          console.log('paymentIntent', paymentIntent);
          console.log('paymentIntent metadata', paymentIntent.metadata);
          
          // Extract user information from metadata
          const userId = paymentIntent.metadata?.user_id;
          console.log('userId', userId);
          const transactionId = paymentIntent.metadata?.transaction_id;
          console.log('transactionId', transactionId);
          const products = paymentIntent.metadata?.products;
          console.log('products', products);
          
          if (userId && transactionId) {
            console.log(`Payment succeeded for user: ${userId}, transaction: ${transactionId}`);
            if (products) {
              try {
                const productsList = JSON.parse(products);
                console.log(`Products purchased:`, productsList);
              } catch (e) {
                console.log(`Products metadata: ${products}`);
              }
            }
          }
          
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
          
          // Extract user information from metadata
          const failedUserId = failedPaymentIntent.metadata?.user_id;
          const failedTransactionId = failedPaymentIntent.metadata?.transaction_id;
          
          if (failedUserId && failedTransactionId) {
            console.log(`Payment failed for user: ${failedUserId}, transaction: ${failedTransactionId}`);
          }
          
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: failedPaymentIntent.id,
            status: 'failed',
            raw_status: failedPaymentIntent.status,
          });
          break;
        case 'payment_intent.canceled':
          const canceledPaymentIntent = event.data.object;
          
          // Extract user information from metadata
          const canceledUserId = canceledPaymentIntent.metadata?.user_id;
          const canceledTransactionId = canceledPaymentIntent.metadata?.transaction_id;
          
          if (canceledUserId && canceledTransactionId) {
            console.log(`Payment canceled for user: ${canceledUserId}, transaction: ${canceledTransactionId}`);
          }
          
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: canceledPaymentIntent.id,
            status: 'canceled',
            raw_status: canceledPaymentIntent.status,
          });
          break;
        case 'payment_intent.requires_action':
          const requireActionPaymentIntent = event.data.object;
          
          // Extract user information from metadata
          const actionUserId = requireActionPaymentIntent.metadata?.user_id;
          const actionTransactionId = requireActionPaymentIntent.metadata?.transaction_id;
          
          if (actionUserId && actionTransactionId) {
            console.log(`Payment requires action for user: ${actionUserId}, transaction: ${actionTransactionId}`);
          }
          
          // Update transaction status in database
          await TransactionRepository.updateTransaction({
            reference_number: requireActionPaymentIntent.id,
            status: 'requires_action',
            raw_status: requireActionPaymentIntent.status,
          });
          break;
        case 'payout.paid':
          const paidPayout = event.data.object;
          console.log(paidPayout);
          break;
        case 'payout.failed':
          const failedPayout = event.data.object;
          console.log(failedPayout);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error', error);
      return { received: false };
    }
  }
}

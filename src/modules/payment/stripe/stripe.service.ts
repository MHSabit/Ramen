import { Injectable } from '@nestjs/common';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { OrderItemRepository } from '../../../common/repository/order-item/order-item.repository';

@Injectable()
export class StripeService {
  constructor(private prisma: PrismaService) {}
  async handleWebhook(rawBody: string, sig: string | string[]) {
    return StripePayment.handleWebhook(rawBody, sig);
  }

  async createPayment({
    userId,
    products,
    currency = 'usd',
    description,
    total_amount,
  }: {
    userId: string;
    products: Array<{
      name: string;
      price: number;
      quantity?: number;
      description?: string;
      product_id?: string;
    }>;
    currency?: string;
    description?: string;
    total_amount?: number;
  }) {
    try {
      // Calculate total amount from products if not provided
      const calculatedTotal = total_amount || products.reduce((sum, product) => {
        return sum + (product.price * (product.quantity || 1));
      }, 0);

      // Get user details including billing_id (Stripe customer ID)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          first_name: true, 
          last_name: true, 
          billing_id: true 
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create transaction record first
      const transaction = await TransactionRepository.createTransaction({
        user_id: userId,
        amount: calculatedTotal,
        currency: currency,
        status: 'pending',
      });

      // Save product details to database as order items
      await OrderItemRepository.createOrderItems({
        transaction_id: transaction.id,
        products: products,
      });

      // Create checkout session with customer and metadata
      const session = await StripePayment.createCheckoutSession({
        customer_id: user.billing_id,
        products: products,
        currency: currency,
        description: description,
        metadata: {
          user_id: userId,
          transaction_id: transaction.id,
          products: JSON.stringify(products.map(p => ({
            name: p.name,
            price: p.price,
            quantity: p.quantity || 1,
            product_id: p.product_id
          }))),
        },
      });

      // Update transaction with reference number
      await TransactionRepository.updateTransaction({
        reference_number: session.id,
        status: 'pending',
      });

      return session;
    } catch (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }
}

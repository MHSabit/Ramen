import { Injectable } from '@nestjs/common';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { OrderItemRepository } from '../../../common/repository/order-item/order-item.repository';
import { ProductRepository } from '../../../common/repository/product/product.repository';

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

      // Validate products
      if (!products || products.length === 0) {
        throw new Error('Products are required');
      }

      // Validate amounts
      if (calculatedTotal <= 0) {
        throw new Error('Total amount must be greater than 0');
      }

      // Check inventory availability before creating payment
      const productsWithIds = products.filter(p => p.product_id);
      // console.log('productsWithIds', productsWithIds);
      if (productsWithIds.length > 0) {
        const stockCheck = await ProductRepository.checkStockAvailability(
          productsWithIds.map(p => ({
            productId: p.product_id,
            quantity: p.quantity || 1
          }))
        );
        // console.log('stockCheck', stockCheck);

        if (!stockCheck.available) {
          const errorMessages = [];
          
          if (stockCheck.missingProducts.length > 0) {
            errorMessages.push(`Products not found: ${stockCheck.missingProducts.map(p => p.productId).join(', ')}`);
          }
          
          if (stockCheck.insufficientProducts.length > 0) {
            errorMessages.push(
              stockCheck.insufficientProducts.map(p => 
                `${p.productName}: Available ${p.availableQuantity}, Requested ${p.requestedQuantity}`
              ).join('; ')
            );
          }
          
          throw new Error(`Insufficient stock: ${errorMessages.join('. ')}`);
        }
      }

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

      // Use database transaction for atomicity
      const result = await this.prisma.$transaction(async (tx) => {
        // Create transaction record first
        const transaction = await tx.paymentTransaction.create({
          data: {
            user_id: userId,
            amount: calculatedTotal,
            currency: currency,
            status: 'pending',
          },
        });

        // Save product details to database as order items
        const orderItems = products.map(product => ({
          transaction_id: transaction.id,
          product_id: product.product_id || null,
          product_name: product.name,
          product_description: product.description || null,
          product_price: Number(product.price),
          quantity: product.quantity || 1,
          total_price: Number(product.price) * (product.quantity || 1),
        }));

        await tx.orderItem.createMany({
          data: orderItems,
        });

        return transaction;
      });

      // Create checkout session with customer and metadata
      const session = await StripePayment.createCheckoutSession({
        customer_id: user.billing_id,
        products: products,
        currency: currency,
        description: description,
        metadata: {
          user_id: userId,
          transaction_id: result.id,
          products: JSON.stringify(products.map(p => ({
            name: p.name,
            price: p.price,
            quantity: p.quantity || 1,
            product_id: p.product_id
          }))),
        },
      });

      // Update transaction with reference number using the transaction ID
      const updatedTransaction = await TransactionRepository.updateTransactionById({
        id: result.id,
        reference_number: session.id,
        status: 'pending',
      });
      
      return session;
    } catch (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }
}

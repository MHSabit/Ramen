import { HttpStatus, Injectable } from '@nestjs/common';
import { StripePayment } from '../../../common/lib/Payment/stripe/StripePayment';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { ProductRepository } from '../../../common/repository/product/product.repository';
import { ApiResponse } from '../../../types/api-response.type';
import { ApiResponseHelper } from '../../../common/helpers/api-response.helper';

@Injectable()
export class StripeService {
  constructor(private prisma: PrismaService) {}
  async handleWebhook(rawBody: string, sig: string | string[]): Promise<ApiResponse<any>> {
    try {
      const result = await StripePayment.handleWebhook(rawBody, sig);
      return ApiResponseHelper.success(
        result,
        'Webhook handled successfully',
        HttpStatus.OK,
        'WEBHOOK_HANDLE_SUCCESS'
      );
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to handle webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'WEBHOOK_HANDLE_ERROR'
      );
    }
  }

  async createPayment({
    userId,
    products,
    currency = 'usd',
    description,
    total_amount,
    // Contact Information
    contact_first_name,
    contact_last_name,
    contact_email,
    contact_phone,
    // Shipping Address
    shipping_address,
    shipping_city,
    shipping_state,
    shipping_zip_code,
    // Shipping Method
    shipping_method,
    shipping_cost,
    shipping_days,
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
    // Contact Information
    contact_first_name: string;
    contact_last_name: string;
    contact_email: string;
    contact_phone: string;
    // Shipping Address
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_zip_code: string;
    // Shipping Method
    shipping_method: 'standard' | 'express' | 'overnight';
    shipping_cost: number;
    shipping_days?: string;
  }): Promise<ApiResponse<any>> {
    try {
      // Calculate total amount from products + shipping if not provided
      const productsTotal = products.reduce((sum, product) => {
        return sum + (product.price * (product.quantity || 1));
      }, 0);
      
      const calculatedTotal = total_amount || (productsTotal + shipping_cost);
      // console.log('calculatedTotal', calculatedTotal);
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
            // Contact Information
            contact_first_name,
            contact_last_name,
            contact_email,
            contact_phone,
            // Shipping Address
            shipping_address,
            shipping_city,
            shipping_state,
            shipping_zip_code,
            // Shipping Method
            shipping_method,
            shipping_cost,
            shipping_days,
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
        const usercart = await this.prisma.user.findUnique({
          where: { id : userId },
        });
        const cartDelete = await this.prisma.cart.deleteMany({
          where: { cart_id: usercart.cart_id },       
        });
        // console.log('cartDelete', cartDelete);
        return transaction;
      });


      // Create checkout session with customer and metadata
      const session = await StripePayment.createCheckoutSession({
        transaction_id: result.id,
        order_id: result.order_id,
        customer_id: user.billing_id,
        products: products,
        currency: currency,
        description: description,
        shipping_cost: shipping_cost,
        shipping_method: shipping_method,
        metadata: {
          user_id: userId,
          transaction_id: result.id,
          products: JSON.stringify(products.map(p => ({
            name: p.name,
            price: p.price,
            quantity: p.quantity || 1,
            product_id: p.product_id
          }))),
          // Contact Information
          contact_first_name,
          contact_last_name,
          contact_email,
          contact_phone,
          // Shipping Address
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_zip_code,
          // Shipping Method
          shipping_method,
          shipping_cost: shipping_cost.toString(),
          shipping_days: shipping_days || '',
        },
      });

      // Update transaction with reference number using the transaction ID
      const updatedTransaction = await TransactionRepository.updateTransactionById({
        id: result.id,
        reference_number: session.id,
        status: 'pending',
      });
      
      return ApiResponseHelper.success(
        { session, transaction: updatedTransaction },
        'Payment session created successfully',
        HttpStatus.CREATED,
        'PAYMENT_SESSION_CREATE_SUCCESS'
      );
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to create payment',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'PAYMENT_SESSION_CREATE_ERROR'
      );
    }
  }

  async getTransactionById(transactionId: string): Promise<ApiResponse<any>> {
    const transaction = await TransactionRepository.getTransactionById(transactionId);
    console.log(transaction)
    return ApiResponseHelper.success(transaction, 'Transaction fetched successfully', HttpStatus.OK, 'TRANSACTION_FETCH_SUCCESS');
  }
}

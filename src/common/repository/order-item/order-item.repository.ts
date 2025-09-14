import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderItemRepository {
  /**
   * Create order items for a transaction
   * @returns
   */
  static async createOrderItems({
    transaction_id,
    products,
  }: {
    transaction_id: string;
    products: Array<{
      name: string;
      price: number;
      quantity?: number;
      description?: string;
      product_id?: string;
    }>;
  }) {
    // Validate product_ids exist in database (if provided)
    const productIds = products
      .map(p => p.product_id)
      .filter(id => id !== undefined && id !== null);
    
    let validProductIds = new Set();
    if (productIds.length > 0) {
      const existingProducts = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
        },
      });
      validProductIds = new Set(existingProducts.map(p => p.id));
    }

    const orderItems = products.map(product => ({
      transaction_id: transaction_id,
      // Only set product_id if it exists in the database
      product_id: product.product_id && validProductIds.has(product.product_id) 
        ? product.product_id 
        : null,
      product_name: product.name,
      product_description: product.description || null,
      product_price: Number(product.price),
      quantity: product.quantity || 1,
      total_price: Number(product.price) * (product.quantity || 1),
    }));

    return await prisma.orderItem.createMany({
      data: orderItems,
    });
  }

  /**
   * Get order items by transaction ID
   * @returns
   */
  static async getOrderItemsByTransactionId(transaction_id: string) {
    return await prisma.orderItem.findMany({
      where: {
        transaction_id: transaction_id,
      },
      include: {
        product: true, // Include product details if product still exists
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  /**
   * Get order items by user ID (through transactions)
   * @returns
   */
  static async getOrderItemsByUserId(user_id: string) {
    return await prisma.orderItem.findMany({
      where: {
        transaction: {
          user_id: user_id,
        },
      },
      include: {
        transaction: true,
        product: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get successful order items by user ID
   * @returns
   */
  static async getSuccessfulOrderItemsByUserId(user_id: string) {
    return await prisma.orderItem.findMany({
      where: {
        transaction: {
          user_id: user_id,
          status: 'succeeded',
        },
      },
      include: {
        transaction: true,
        product: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}

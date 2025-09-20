import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductRepository {
  /**
   * Reduce product quantity by specified amount
   * @param productId - The ID of the product
   * @param quantity - The quantity to reduce
   * @returns Updated product or null if not found/insufficient stock
   */
  static async reduceProductQuantity(productId: string, quantity: number) {
    try {
      // First, check if product exists and has sufficient quantity
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, quantity: true, name: true }
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      if (product.quantity < quantity) {
        throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.quantity}, Requested: ${quantity}`);
      }

      // Reduce the quantity
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          quantity: {
            decrement: quantity
          }
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          price: true
        }
      });

      return updatedProduct;
    } catch (error) {
      throw new Error(`Failed to reduce product quantity: ${error.message}`);
    }
  }

  /**
   * Reduce multiple products' quantities atomically
   * @param products - Array of products with their quantities to reduce
   * @returns Array of updated products
   */
  static async reduceMultipleProductQuantities(products: Array<{ productId: string; quantity: number }>) {
    try {
      return await prisma.$transaction(async (tx) => {
        const results = [];

        for (const { productId, quantity } of products) {
          // Check if product exists and has sufficient quantity
          const product = await tx.product.findUnique({
            where: { id: productId },
            select: { id: true, quantity: true, name: true }
          });

          if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
          }

          if (product.quantity < quantity) {
            throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.quantity}, Requested: ${quantity}`);
          }

          // Reduce the quantity
          const updatedProduct = await tx.product.update({
            where: { id: productId },
            data: {
              quantity: {
                decrement: quantity
              }
            },
            select: {
              id: true,
              name: true,
              quantity: true,
              price: true
            }
          });

          results.push(updatedProduct);
        }

        return results;
      });
    } catch (error) {
      throw new Error(`Failed to reduce multiple product quantities: ${error.message}`);
    }
  }

  /**
   * Check if products have sufficient stock
   * @param products - Array of products to check
   * @returns Object with stock availability status
   */
  static async checkStockAvailability(products: Array<{ productId: string; quantity: number }>) {
    try {
      const productIds = products.map(p => p.productId);
    //   console.log('productIds2', productIds);
      const existingProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds }
        },
        select: {
          id: true,
          name: true,
          quantity: true
        }
      });
    //   console.log('existingProducts', existingProducts);

      const stockCheck = {
        available: true,
        insufficientProducts: [],
        missingProducts: []
      };

      for (const { productId, quantity } of products) {
        const product = existingProducts.find(p => p.id === productId);
        
        if (!product) {
          stockCheck.available = false;
          stockCheck.missingProducts.push({ productId, requestedQuantity: quantity });
        } else if (product.quantity < quantity) {
          stockCheck.available = false;
          stockCheck.insufficientProducts.push({
            productId,
            productName: product.name,
            availableQuantity: product.quantity,
            requestedQuantity: quantity
          });
        }
      }
    //   console.log('stockCheck', stockCheck);
      return stockCheck;
    } catch (error) {
      throw new Error(`Failed to check stock availability: ${error.message}`);
    }
  }

  /**
   * Get product by ID
   * @param productId - The ID of the product
   * @returns Product details
   */
  static async getProductById(productId: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true
        }
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      return product;
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  /**
   * Restore product quantity (for refunds/cancellations)
   * @param productId - The ID of the product
   * @param quantity - The quantity to restore
   * @returns Updated product
   */
  static async restoreProductQuantity(productId: string, quantity: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true }
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          quantity: {
            increment: quantity
          }
        },
        select: {
          id: true,
          name: true,
          quantity: true,
          price: true
        }
      });

      return updatedProduct;
    } catch (error) {
      throw new Error(`Failed to restore product quantity: ${error.message}`);
    }
  }
}

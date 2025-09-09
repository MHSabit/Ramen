import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CartService {
  constructor() {}

  async getCartByUserID(user_id: string) {
    return prisma.cart.findMany({
      where: { user_id },
    });
  }

  // Add product to cart
async addToCart(user_id: string, productId: string, quantity: number) {
  try {
    console.log(
      'add to cart function inside the service file',
      user_id,
      productId,
      quantity,
    );

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    console.log('product', product);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingItem = await prisma.cart.findFirst({
    where: {
        user_id : user_id,
        product_id: productId,
    },
    });

    console.log('existing item', existingItem);

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      return prisma.cart.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          total_price: product.price.mul(newQty),
        },
      });
    }

    return prisma.cart.create({
      data: {
        user_id,
        product_id: productId,
        quantity,
        unit_price: product.price,
        total_price: product.price.mul(quantity),
      },
    });
  } catch (error) {
    console.error(' Error in addToCart:', error);
    throw error; // rethrow so NestJS can handl
  }
}


  // ✅ Update quantity of a cart item
  async updateCartItem(cartId: string, quantity: number) {
    const cartItem = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!cartItem) throw new NotFoundException('Cart item not found');

    return prisma.cart.update({
      where: { id: cartId },
      data: {
        quantity,
        total_price: cartItem.unit_price.mul(quantity),
      },
    });
  }

  // ✅ Remove an item from cart
  async removeCartItem(cartId: string) {
    return prisma.cart.delete({
      where: { id: cartId },
    });
  }
}

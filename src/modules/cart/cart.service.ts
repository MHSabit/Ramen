import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { addToProductDto } from './add-to-product.dto';

const prisma = new PrismaClient();

@Injectable()
export class CartService {
  constructor() {}

    async getCartByUserID(user_id: string) {
        // return prisma.cart.findMany({
        // where: { user_id },
        // });
    }

    async addToCart(cart_id: string, body: addToProductDto) {
    try {
            const productId = body.product_id;
            const productQuantity = body.product_quantity;

            // 1. Check if product exists
            const product = await prisma.product.findUnique({
                where: { id: productId },
            });
            console.log('product', product);

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            // 2. Check if product already in cart
            const existingItem = await prisma.cart.findFirst({
            where: {
                cart_id: cart_id,
                product_id: productId,
            },
            });

            if (existingItem) {
                console.log('existing item', existingItem);
                console.log(" sabit_quantity", existingItem.quantity, productQuantity );
                const newQty = existingItem.quantity + productQuantity;

                return await prisma.cart.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQty },
                });
            }

            // 3. If not exist, create a new cart item
            return await prisma.cart.create({
                data: {
                    cart_id,
                    product_id: productId,
                    quantity: productQuantity,
                    unit_price: product.price,
                },
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            // Rethrow so NestJS can handle it via exception filters
            throw new Error('Failed to add product to cart');
        }
    }



























    // // Add product to cart
    // async addToCart(user_id: string, productId: string, quantity: number) {
    // try {
    //     console.log(
    //     'add to cart function inside the service file',
    //     user_id,
    //     productId,
    //     quantity,
    //     );

    //     const product = await prisma.product.findUnique({
    //     where: { id: productId },
    //     });

    //     console.log('product', product);

    //     if (!product) {
    //     throw new NotFoundException('Product not found');
    //     }

    //     const existingItem = await prisma.cart.findFirst({
    //     where: {
    //         user_id : user_id,
    //         product_id: productId,
    //     },
    //     });

    //     console.log('existing item', existingItem);

    //     if (existingItem) {
    //     const newQty = existingItem.quantity + quantity;
    //     return prisma.cart.update({
    //         where: { id: existingItem.id },
    //         data: {
    //         quantity: newQty,
    //         total_price: product.price.mul(newQty),
    //         },
    //     });
    //     }

    //     //     return prisma.cart.create({
    //     //         data: {
    //     //             user_id,
    //     //             product_id: productId,
    //     //             quantity,
    //     //             unit_price: product.price,
    //     //             total_price: product.price.mul(quantity),
    //     //         },
    //     // });
        
    //     } catch (error) {
    //         console.error(' Error in addToCart:', error);
    //         throw error; // rethrow so NestJS can handl
    //     }
    // }


    // // ✅ Update quantity of a cart item
    // async updateCartItem(user_id: string, body) {
    //     const cartId = body.cartId;
    //     const productId = body.productId;
    //     const quantity = body.quantity;
    //     const cartItem = await prisma.cart.findUnique({ where: { id: cartId } });
    //     if (!cartItem) throw new NotFoundException('Cart item not found');

    //     return prisma.cart.update({
    //     where: { 
    //         id: cartId,
    //         product_id: productId,
    //     },
    //     data: {
    //         quantity,
    //         total_price: cartItem.unit_price.mul(quantity),
    //     },
    //     });
    // }

    // // ✅ Remove an item from cart
    // async removeCartItem(cartId: string, productId: string) {
    //     return prisma.cart.delete({
    //     where: { 
    //         id: cartId,
    //     },
    //     });
    // }
}

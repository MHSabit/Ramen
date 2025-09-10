import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { addToProductDto } from './add-to-product.dto';

const prisma = new PrismaClient();

@Injectable()
export class CartService {
    constructor() {}

    async getallproductByCartId(cart_id: string) {
    try {
        if (!cart_id) {
            throw new NotFoundException('Cart ID is required');
        }

        const cart = await prisma.cart.findMany({
            where: { cart_id },
        });

        if (!cart || cart.length === 0) {
            throw new NotFoundException(`No items found for cart_id: ${cart_id}`);
        }

        return cart;
    } catch (error) {
        console.error('Error fetching cart items:', error);
        if (error instanceof NotFoundException) throw error;
        throw new InternalServerErrorException('Failed to fetch cart items');
        }
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

    async updateCartItem(cartId: string, body: addToProductDto) {
        try {
                if (!cartId || !body.product_id) {
                    throw new NotFoundException('Cart ID and Product ID are required');
                }

                const existingItem = await prisma.cart.findFirst({
                    where: {
                        cart_id: cartId,
                        product_id: body.product_id,
                    },
                });

                if (!existingItem) {
                    throw new NotFoundException(
                        `Product ${body.product_id} not found in cart ${cartId}`
                );
                }

                const newQty = body.product_quantity;

                return await prisma.cart.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQty },
                });
            } catch (error) {
                console.error('Error updating cart item:', error);
                if (error instanceof NotFoundException) throw error;
                throw new InternalServerErrorException('Failed to update cart item');
        }
    }
    
    //  Remove an item from cart
    async removeCartItem(cartId: string, productId: string) {
        try {
                if (!cartId || !productId) {
                    throw new NotFoundException('Cart ID and Product ID are required');
                }

                const existingItem = await prisma.cart.findFirst({
                where: {
                    cart_id: cartId,
                    product_id: productId,
                },
                });

                if (!existingItem) {
                    throw new NotFoundException(
                        `Product ${productId} not found in cart ${cartId}`
                );
                }

                return await prisma.cart.delete({
                    where: { id: existingItem.id },
                });
            } catch (error) {
                console.error('Error removing cart item:', error);
                if (error instanceof NotFoundException) throw error;
                throw new InternalServerErrorException('Failed to remove cart item');
        }
    }

}

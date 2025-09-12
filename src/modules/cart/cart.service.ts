import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { addToProductDto } from './add-to-product.dto';

const prisma = new PrismaClient();

@Injectable()
export class CartService {
    constructor() {}

    async getallproductByCartId(cart_id: string, userId: string) {
        try {
            console.log('cart id -  User id ', cart_id, userId);
            if (!cart_id) {
                throw new NotFoundException('Cart ID is required');
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            console.log('user', user);

            if (!user) {
                throw new NotFoundException('User not found');
            }

            if(user.cart_id !== cart_id){
                console.log("sabit",user.cart_id, cart_id);
                throw new NotFoundException('Cart id is belog to other user');
            }

            const cart = await prisma.cart.findMany({
                where: { cart_id },
            });

            if (!cart || cart.length === 0) {
                throw new NotFoundException(`No items found for cart_id: ${cart_id}`);
            }

            // return cart;
            return {
                success: true,
                message: "All Products of the cart fetched successfully",
                data: { cart }
            };

        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                throw new HttpException({
                success: false,
                message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
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

                const updatedData =  await prisma.cart.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQty },
                });

                return {
                    success: true,
                    message: "Products is added to cart successfully",
                    data: {updatedData},
                }; 
            }

            // 3. If not exist, create a new cart item
            const newItem = await prisma.cart.create({
                data: {
                    cart_id,
                    product_id: productId,
                    quantity: productQuantity,
                    unit_price: product.price,
                },
            });

            return  {
                success: true,
                message: "Products is added to cart successfully",
                data: {
                    newItem
                },
            };
        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
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

                const updatedCartItem =  await prisma.cart.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQty },
                });

                return {
                    success: true,
                    message: "cart item updated successfully",
                    data: {
                        updatedCartItem
                    },
                };
            } catch (error) {
                if(error instanceof HttpException){
                    throw error;
                }else{
                    throw new HttpException({
                        success: false,
                        message: error.message,
                    }, HttpStatus.INTERNAL_SERVER_ERROR);
                }
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

                const deletedItem =  await prisma.cart.delete({
                    where: { id: existingItem.id },
                });

                return {
                    success: true,
                    message: "Products is removed from cart successfully",
                    data: {
                        deletedItem
                    },
                };


            } catch (error) {
                if(error instanceof HttpException){
                    throw error;
                } else{
                    throw new HttpException({
                        success: false,
                        message: error.message,
                    }, HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
    }

}

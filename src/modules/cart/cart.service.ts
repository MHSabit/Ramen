import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { addToProductDto } from './add-to-product.dto';
import { ApiResponse } from '../../types/api-response.type';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import appConfig from 'src/config/app.config';

const prisma = new PrismaClient();

@Injectable()
export class CartService {
    constructor() {}

    async getallproductByCartId(cart_id: string, userId: string): Promise<ApiResponse<any>> {
        try {
            if (!cart_id) {
                throw new NotFoundException('Cart ID is required');
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            if(user.cart_id !== cart_id){
                throw new NotFoundException('Cart id is belog to other user');
            }

            const cart = await prisma.cart.findMany({
                where: { cart_id },
            });

            if (!cart || cart.length === 0) {
                throw new NotFoundException(`No items found for cart_id: ${cart_id}`);
            }

            // fetch product details for all cart items
            const productIds = cart.map((i) => i.product_id);
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    image: true,
                    spice_level: true,
                    features: true,
                    popular: true,
                    original_price: true,
                },
            });
            const productById = new Map(products.map((p) => [p.id, p]));

            const itemsWithProduct = cart.map((item) => {
                const p = productById.get(item.product_id) || null;
                const productWithImageUrl = p
                    ? {
                        ...p,
                        imageUrl: p.image ? `${appConfig().app.url}/public/storage/${p.image}` : null,
                      }
                    : null;
                return {
                    ...item,
                    product: productWithImageUrl,
                };
            });

            return ApiResponseHelper.success(
                { cart: itemsWithProduct },
                "All Products of the cart fetched successfully",
                HttpStatus.OK,
                "CART_ITEMS_FETCH_SUCCESS"
            );

        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                return ApiResponseHelper.error(
                    error.message || 'Failed to fetch cart items',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'CART_ITEMS_FETCH_ERROR'
                );
            }
        }
    }


    async addToCart(cart_id: string, body: addToProductDto, userId: string): Promise<ApiResponse<any>> {
    try {
            const productId = body.product_id;
            const productQuantity = body.product_quantity;

            // 1. Check if product exists
            const product = await prisma.product.findUnique({
                where: { id: productId },
            });
<<<<<<< HEAD
            // console.log('product', product);
=======
>>>>>>> 91fd4252c494342f5edcf1ad04fc3dbc53591999

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if(!user){
                throw new NotFoundException('User not found');
            }

            if(cart_id !== user.cart_id){
                throw new NotFoundException('Cart id is belog to other user');
            }
            
            // 2. Check if product already in cart
            const existingItem = await prisma.cart.findFirst({
            where: {
                cart_id: cart_id,
                product_id: productId,
            },
            });

            if (existingItem) {
<<<<<<< HEAD
                // console.log('existing item', existingItem);
=======
>>>>>>> 91fd4252c494342f5edcf1ad04fc3dbc53591999
                const newQty = existingItem.quantity + productQuantity;

                const updatedData =  await prisma.cart.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQty },
                });

                return ApiResponseHelper.success(
                    { updatedData },
                    "Product is added to cart successfully",
                    HttpStatus.OK,
                    "CART_ITEM_UPSERT_SUCCESS"
                ); 
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

            return ApiResponseHelper.success(
                { newItem },
                "Product is added to cart successfully",
                HttpStatus.CREATED,
                "CART_ITEM_CREATE_SUCCESS"
            );
        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                return ApiResponseHelper.error(
                    error.message || 'Failed to add to cart',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'CART_ITEM_CREATE_ERROR'
                );
            }
        }
    }

    async updateCartItem(cartId: string, body: addToProductDto, userId: string): Promise<ApiResponse<any>> {
        try {
                if (!cartId || !body.product_id) {
                    throw new NotFoundException('Cart ID and Product ID are required');
                }
                const user = await prisma.user.findUnique({
                        where: { id: userId },
                    });
<<<<<<< HEAD
                // console.log("sabit",user.cart_id, cartId);
                if(cartId !== user.cart_id){
                    // console.log("sabit",user.cart_id, cartId);
=======
                if(cartId !== user.cart_id){
>>>>>>> 91fd4252c494342f5edcf1ad04fc3dbc53591999
                    throw new NotFoundException('Cart id is belog to other user');
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

                return ApiResponseHelper.success(
                    { updatedCartItem },
                    "Cart item updated successfully",
                    HttpStatus.OK,
                    "CART_ITEM_UPDATE_SUCCESS"
                );
            } catch (error) {
                if(error instanceof HttpException){
                    throw error;
                }else{
                    return ApiResponseHelper.error(
                        error.message || 'Failed to update cart item',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        'CART_ITEM_UPDATE_ERROR'
                    );
                }
            }
    }
    
    //  Remove an item from cart
    async removeCartItem(cartId: string, productId: string, userId: string): Promise<ApiResponse<any>> {
        try {
            if (!cartId || !productId) {
                    throw new NotFoundException('Cart ID and Product ID are required');
                }
                const user = await prisma.user.findUnique({
                        where: { id: userId },
                    });
<<<<<<< HEAD
                if(cartId !== user.cart_id){
=======
                if(!user){
                    throw new NotFoundException('User not found');
                }
                if(cartId !== user?.cart_id){
>>>>>>> 91fd4252c494342f5edcf1ad04fc3dbc53591999
                    throw new NotFoundException('Cart id is belog to other user');
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

                return ApiResponseHelper.success(
                    { deletedItem },
                    "Product is removed from cart successfully",
                    HttpStatus.OK,
                    "CART_ITEM_DELETE_SUCCESS"
                );


            } catch (error) {
                if(error instanceof HttpException){
                    throw error;
                } else{
                    return ApiResponseHelper.error(
                        error.message || 'Failed to remove cart item',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        'CART_ITEM_DELETE_ERROR'
                    );
                }
            }
    }

    async clearCart(userID) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userID },
            });
            if (!user) {
                throw new NotFoundException('User not found');
            }

            if(user.cart_id){
                const cartID =  user.cart_id;
                const cartClear = await prisma.cart.deleteMany({    
                    where: { cart_id: cartID },
                });
            } 
    } catch (error) {
                if(error instanceof HttpException){
                    throw error;
                } else{
                    return ApiResponseHelper.error(
                        error.message || 'Failed to remove cart ',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        'CART_ITEM_DELETE_ERROR'
                    );
                }
            }
    }

}

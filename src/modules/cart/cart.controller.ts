import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { addToProductDto } from './add-to-product.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
    constructor(
        private readonly cartService: CartService
    ) {}

    @Get(':cart_id')
    async getallproductByCartId(
    @Param('cart_id') cart_id: string,
    @Req() req: Request
    ) {
        return this.cartService.getallproductByCartId(cart_id, req.user.userId);
    }

    @Post(':cart_id')
    async addToCart(
        @Req() req: Request, 
        @Body() body: addToProductDto, 
        @Param('cart_id') cart_id: string   // ✅ use Param here
    ) {
        return this.cartService.addToCart(cart_id, req.body, req.user.userId);
    }

    @Put(':cart_id')
    async updateCartItem(
        @Param('cart_id') cart_id: string,
        @Body() body: addToProductDto,
        @Req() req: Request
    ) {
        return this.cartService.updateCartItem(cart_id, body, req.user.userId);
    }

    @Delete(':cart_id/:product_id')
    async removeCartItem(
        @Param('cart_id') cart_id: string,
        @Param('product_id') product_id: string,
        @Req() req: Request
    ) {
        const removeCartItem = await this.cartService.removeCartItem(cart_id, product_id, req.user.userId);
        return removeCartItem;
    }


    @Delete()
    async clearCacrt(
        @Req() req: Request
    ) {
        return this.cartService.clearCart(req.user.userId);

    }

}

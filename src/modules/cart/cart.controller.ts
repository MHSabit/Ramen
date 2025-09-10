import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { addToProductDto } from './add-to-product.dto';

// @UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
    constructor(
        private readonly cartService: CartService
    ) {}

    @Get(':cart_id')
    async getallproductByCartId(
    @Param('cart_id') cart_id: string
    ) {
    console.log('cart id inside controller', cart_id);
    return this.cartService.getallproductByCartId(cart_id);
    }

    @Post(':cart_id')
    async addToCart(
        @Req() req: Request, 
        @Body() body: addToProductDto, 
        @Param('cart_id') cart_id: string   // ✅ use Param here
    ) {
        console.log('cart id inside controller', cart_id);
        return this.cartService.addToCart(cart_id, req.body);
    }

    @Put(':cart_id')
    async updateCartItem(
        @Param('cart_id') cart_id: string,
        @Body() body: addToProductDto
    ) {
        console.log('cart_id:', cart_id);
        // return "update";
        return this.cartService.updateCartItem(cart_id, body);
    }

    @Delete(':cart_id/:product_id')
    async removeCartItem(
    @Param('cart_id') cart_id: string,
    @Param('product_id') product_id: string
    ) {
        console.log('cart_id:', cart_id);
        console.log('product_id:', product_id);
    return this.cartService.removeCartItem(cart_id, product_id);
    }

}

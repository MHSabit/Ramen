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

    @Get(':id')
    async getallproductByCartId(@Req() req: Request, @Query('id') id: string) {
        return " get all product by cart id";
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


    @Put()
    async updateCartItem(@Req() req: Request) {
        return " update cart item";
    }

    @Delete(':id')
    async removeCartItem(@Req() req: Request, @Query('id') id: string) {
        return " remove cart item";
    }

}

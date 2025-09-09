import { Body, Controller, Delete, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// @UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
    constructor(
        private readonly cartService: CartService
    ) {}

    
    @Get()
    getCartByUserID(@Req() req: Request,) {
        const user_id = "abc";
        return this.cartService.getCartByUserID(user_id);
    }

    @Post()
    addToCart(@Body() body) {
        console.log("sabit")
        const user_id = "abc";
        console.log(user_id, body);
       return this.cartService.addToCart(user_id, body.product_id, body.quantity);
    }

    @Put()
    updateCart() {
        return 'This action updates cart';
    }

    @Delete()
    removeCartItem() {
        return 'This action deletes cart';
    }

}

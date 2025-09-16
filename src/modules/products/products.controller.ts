import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('related/:productId')
  @ApiOperation({ summary: 'Get related products' })
  async getRelatedProducts(@Param('productId') productId: string) {
    return this.productsService.getRelatedProducts(productId);
  }

}

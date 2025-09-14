import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // get all products
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  async findAll() {
    return this.productsService.findAll();
  }


  // get product by id
  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

}

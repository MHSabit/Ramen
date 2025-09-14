import { Controller, Get,  Param, Query } from '@nestjs/common';
import { ProductPageService } from './product-page.service';

@Controller('product-page')
export class ProductPageController {
  constructor(private readonly productPageService: ProductPageService) {}
  // Get all product pages
  // we have get all product using pagination search and limit
  // @ApiOperation({ summary: 'Get all product pages' })
  @Get()
  async findAll(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string
  ) {
    return this.productPageService.findAll(q, limit, page);
  }



}

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

  // Get product page by id
  // we have to get the product page by id
  // @ApiOperation({ summary: 'Get product page by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productPageService.findOne(id);
  }


}

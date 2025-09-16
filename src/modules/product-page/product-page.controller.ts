import { Controller, Get,  Param, Query } from '@nestjs/common';
import { ProductPageService } from './product-page.service';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';

@Controller('product-page')
export class ProductPageController {
  constructor(private readonly productPageService: ProductPageService) {}
  @Get()
  @SkipTransform()
  async findAll(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string
  ) {
    return this.productPageService.findAll(q, limit, page);
  }



}

import { Module } from '@nestjs/common';
import { ProductPageService } from './product-page.service';
import { ProductPageController } from './product-page.controller';

@Module({
  controllers: [ProductPageController],
  providers: [ProductPageService],
})
export class ProductPageModule {}

import { Module } from '@nestjs/common';
import { ProductCategoryController } from './product-category.controller';
import { ProductCategoryService } from './product-category.service';
import { CategoryFileUploadService } from './services/category-file-upload.service';

@Module({
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService, CategoryFileUploadService],
})
export class ProductCategoryModule {}

import { Module } from '@nestjs/common';
import { CategoryListService } from './category-list.service';
import { CategoryListController } from './category-list.controller';

@Module({
  controllers: [CategoryListController],
  providers: [CategoryListService],
})
export class CategoryListModule {}

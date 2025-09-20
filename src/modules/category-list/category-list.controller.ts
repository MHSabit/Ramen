import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CategoryListService } from './category-list.service';
import { CreateCategoryListDto } from './dto/create-category-list.dto';
import { UpdateCategoryListDto } from './dto/update-category-list.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('category-list')
export class CategoryListController {
  constructor(private readonly categoryListService: CategoryListService) {}

  @Get()
  @ApiOperation({ summary: 'Get all category list' })
  async findAll() {
    return this.categoryListService.findAll();
  }

  // get product in category by id
  // implment pagination, limit and search
  @Get(':id')
  @ApiOperation({ summary: 'Get product in category by id' })
  async findOne(@Param('id') id: string) {
    return this.categoryListService.findOne(id);
  }

}

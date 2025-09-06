import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateCategoryDto } from './dtos/create-category.to';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { ProductCategoryService } from './product-category.service';

@Controller('product-category')
export class ProductCategoryController {

    constructor(
        private readonly productCategoryService: ProductCategoryService,
    ) {}


    @Get()
    getAllCategories() {
        return this.productCategoryService.getAllProductCategories();
    }

    @Get(':id')
    getCategoryById(@Param('id') id: string) {
        return this.productCategoryService.getProductCategoryById(id);
    }

    @Post()
    createCategory(@Body() category: CreateCategoryDto) {
        return this.productCategoryService.createProductCategory(category);
    }

    @Put(':id')
    updateCategoryById(@Body() category: UpdateCategoryDto, @Param('id') id: string) {
        return this.productCategoryService.updateProductCategoryById(category, id);
    }

    @Delete(':id')
    deleteCategoryById(@Param('id') id: string) {
        return this.productCategoryService.deleteProductCategoryById(id);
    }
}

import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors, UploadedFile, Patch } from '@nestjs/common';
import { CreateCategoryDto } from './dtos/create-category.to';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { ProductCategoryService } from './product-category.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { SkipTransform } from 'src/common/decorators/skip-transform.decorator';

@ApiTags('Admin Product Categories')
@ApiBearerAuth()
@Controller('admin/product-category')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductCategoryController {

    constructor(
        private readonly productCategoryService: ProductCategoryService,
    ) {}


    @Get()
    @SkipTransform()
    @ApiOperation({ summary: 'Get all product categories' })
    async getAllCategories() {
        return this.productCategoryService.getAllProductCategories();
    }

    @Get(':id')
    @SkipTransform()
    @ApiOperation({ summary: 'Get product category by ID' })
    async getCategoryById(@Param('id') id: string) {
        return this.productCategoryService.getProductCategoryById(id);
    }

    @Post()
    @SkipTransform()
    @ApiOperation({ summary: 'Create a new product category' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: memoryStorage(),
        }),
    )
    async createCategory(
        @Body() category: CreateCategoryDto,
        @UploadedFile() image?: Express.Multer.File
    ) {
        // Add the uploaded file to the category data
        if (image) {
            category.image = image;
        }
        return this.productCategoryService.createProductCategory(category);
    }

    @Patch(':id')
    @SkipTransform()
    @ApiOperation({ summary: 'Update product category by ID' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: memoryStorage(),
        }),
    )
    async updateCategoryById(
        @Body() category: UpdateCategoryDto, 
        @Param('id') id: string,
        @UploadedFile() image?: Express.Multer.File
    ) {
        // Add the uploaded file to the category data
        if (image) {
            category.image = image;
        }
        return this.productCategoryService.updateProductCategoryById(category, id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete product category by ID' })
    async deleteCategoryById(@Param('id') id: string) {
        return this.productCategoryService.deleteProductCategoryById(id);
    }
}

import { Body, Controller, Delete, Get, Param, Post, Req, Put, UseGuards, UseInterceptors, UploadedFile, Patch, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dtos';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { SkipTransform } from 'src/common/decorators/skip-transform.decorator';

@ApiTags('Admin Products')
@ApiBearerAuth()
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProductsController {

    constructor(
        private readonly productService: ProductsService
    ) {}
    

    // get all the product 
    // we have to implement the pagination and the limit and the search using by the name of the product
    @Get()
    @SkipTransform()
    @ApiOperation({ summary: 'Get all products with pagination and search' })
    async getAllProducts(
        @Req() req: Request,
        @Query('q') q?: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        // Set defaults: page = 1, limit = 10
        const pageNumber = page ? parseInt(page, 10) : 1;
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        
        // Validate inputs
        if (pageNumber < 1) {
            throw new HttpException('Page must be greater than 0', HttpStatus.BAD_REQUEST);
        }
        if (limitNumber < 1 || limitNumber > 100) {
            throw new HttpException('Limit must be between 1 and 100', HttpStatus.BAD_REQUEST);
        }
        console.log('req.user', req.user.userId);
        return await this.productService.getAllProducts(q, limitNumber, pageNumber);
    }


    // get product by id
    @Get(':id')
    @SkipTransform()
    @ApiOperation({ summary: 'Get product by ID' })
    async getProductById(@Param('id') id: string) {
        return await this.productService.getProductById(id);
    }



    // create product
    @Post('/add-product')
    @SkipTransform()
    @ApiOperation({ summary: 'Create a new product' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: memoryStorage(),
        }),
    )
    async createProduct(
        @Body() product: CreateProductDto,
        @UploadedFile() image?: Express.Multer.File
    ) {
        if (image) {
            product.image = image;
        }
        return await this.productService.createProduct(product);
    }




    // update product by id
    @Patch(':id')
    @SkipTransform()
    @ApiOperation({ summary: 'Update product by ID' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: memoryStorage(),
        }),
    )
    async updateProductById(
        @Body() product: UpdateProductDto, 
        @Param('id') id: string,
        @UploadedFile() image?: Express.Multer.File
    ) {
        // Add the uploaded file to the product data
        console.log("product", product);

        if (image) {
            product.image = image;
        }
        return await this.productService.updateProductById(id, product);
    }


    @Delete(':id')
    @SkipTransform()
    @ApiOperation({ summary: 'Delete product by ID' })
    async deleteProductById(@Param('id') id: string) {
        return await this.productService.deleteProductById(id);
    }
}

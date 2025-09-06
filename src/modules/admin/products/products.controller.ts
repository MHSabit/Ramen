import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dtos';

@Controller('products')
export class ProductsController {

    constructor(
        private readonly productService: ProductsService
    ) {}
    

    // get all the product 
    @Get()
    getAllProducts() {
        return this.productService.getAllProducts();
    }


    // get product by id
    @Get(':id')
    getProductById(@Param('id') id: string) {
        return this.productService.getProductById(id);
    }



    // create product
    @Post()
    createProduct(@Body() product: CreateProductDto) {
        return this.productService.createProduct(product);
    }




    // update product by id
    @Put(':id')
    updateProductById(@Body() product:UpdateProductDto, @Param('id') id: string) {
       return this.productService.updateProductById(id, product);
    }


    @Delete(':id')
    deleteProductById(@Param('id') id: string) {
        return this.productService.deleteProductById(id);
    }
}

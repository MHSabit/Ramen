import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { PrismaClient } from '@prisma/client';
import { UpdateProductDto } from './dtos/update-product.dtos';
import { FileUploadService } from './services/file-upload.service';
import appConfig from 'src/config/app.config';
import { Http2ServerRequest } from 'http2';

const prisma = new PrismaClient();

@Injectable()
export class ProductsService {

    constructor(
        private readonly fileUploadService: FileUploadService
    ) {}


    // get all products
    async getAllProducts(q: string, limit: number, page: number) {
        try {   
            // Build where condition for search
            const where_condition: any = {};
            if(q){
                where_condition.name = {
                    contains: q,
                    mode: 'insensitive', // Case insensitive search
                };
            }

            // Calculate pagination
            const skip = (page - 1) * limit;
            
            // Get products with pagination and search
            const products = await prisma.product.findMany({
                where: where_condition,
                take: limit,
                skip: skip,
                orderBy: {
                    created_at: 'desc' // Order by newest first
                }
            });

            // Get total count for pagination info
            const totalCount = await prisma.product.count({
                where: where_condition
            });
            // Calculate pagination metadata
            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                success: true,
                message: "Products fetched successfully",
                data: {
                    products,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalCount,
                        limit,
                        hasNextPage,
                        hasPrevPage
                    }
                }
            };
        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    // get product by id
    async getProductById(id: string) {

        try {
            if(!id){
                throw new HttpException({
                    success: false,
                    message: "Product ID is required",
                }, HttpStatus.BAD_REQUEST);
            }
            const product = await prisma.product.findUnique({
                where: {
                    id: id,
                },
            });
            
            if (!product) {
                throw new HttpException({
                    success: false,
                    message: "Product not found",
                }, HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                message: "Product fetched successfully",
                data: {
                    ...product,
                    imageUrl: product.image ? `${appConfig().app.url}/public/storage/product_image/${product.image.split('/').pop()}` : null
                }
            };
        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }



    // create product
    async createProduct(product: CreateProductDto) {
        try {
            let imageUrl = null;
            
            // Handle image upload if provided
            if (product.image) {
                imageUrl = await this.fileUploadService.uploadProductImage(product.image);
            }

            const save = await prisma.product.create({
                data: {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: imageUrl,
                    category: product.category,
                    quantity: product.quantity || 0,
                    spice_level: product.spice_level,
                    features: product.features,
                    popular: product.popular || false,
                },
            });
            return {
                success: true,
                message: "Product created successfully",
                data: {
                    ...save,
                    imageUrl: save.image ? `${appConfig().app.url}/public/storage/${save.image.split('/').pop()}` : null
                }
            };
        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    async updateProductById(id: string, product: UpdateProductDto) {
        try {
            if (!id) {
                throw new HttpException({
                    success: false,
                    message: "Invalid product ID",
                }, HttpStatus.BAD_REQUEST);
            }

            // Check if product exists
            const existingProduct = await prisma.product.findUnique({
                where: { id },
            });

            if (!existingProduct) {
                throw new HttpException({
                    success: false,
                    message: "Product not found",
                }, HttpStatus.NOT_FOUND);
            }

            // Build updateData object dynamically
            const updateData: any = {};
            if (product.name !== undefined) updateData.name = product.name;
            if (product.description !== undefined) updateData.description = product.description;
            if (product.price !== undefined) updateData.price = product.price;
            if (product.category !== undefined) updateData.category = product.category;
            if (product.quantity !== undefined) updateData.quantity = product.quantity;
            if (product.spice_level !== undefined) updateData.spice_level = product.spice_level;
            if (product.features !== undefined) updateData.features = product.features;
            if (product.popular !== undefined) updateData.popular = product.popular;

            // Handle image upload if new image is provided
            if (product.image) {
                // Delete old image if exists
                if (existingProduct.image) {
                    const deleteResult = await this.fileUploadService.deleteProductImage(existingProduct.image);
                }
                
                // Upload new image
                const imageUrl = await this.fileUploadService.uploadProductImage(product.image);
                updateData.image = imageUrl;
            }

            // Update product
            const updatedProduct = await prisma.product.update({
                where: { id },
                data: updateData,
            });

            return {
                success: true,
                message: "Product updated successfully",
                data: {
                    ...updatedProduct,
                    imageUrl: updatedProduct.image ? `${appConfig().app.url}/public/storage/product_image/${updatedProduct.image.split('/').pop()}` : null
                }
            };
        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }


    async deleteProductById(id: string) {
        try {
            if (!id) {
                throw new HttpException({
                    success: false,
                    message: "Invalid product ID",
                }, HttpStatus.BAD_REQUEST);
            }

            // Check if product exists
            const product = await prisma.product.findUnique({
                where: { id },
            });

            if (!product) {
                throw new HttpException({
                    success: false,
                    message: "Product not found",
                }, HttpStatus.NOT_FOUND);
            }

            // Delete associated image if exists
            if (product.image) {
                await this.fileUploadService.deleteProductImage(product.image);
            }

            // we have to delete the image from the storage
            if (product.image) {
                await this.fileUploadService.deleteProductImage(product.image);
            }

            // Delete the product
            const deletedProduct = await prisma.product.delete({
                where: { id },
            });

            return {
                success: true,
                message: "Product deleted successfully",
                data: null
            };
        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

}



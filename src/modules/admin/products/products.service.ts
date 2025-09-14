import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { PrismaClient, Product } from '@prisma/client';
import { UpdateProductDto } from './dtos/update-product.dtos';
import { FileUploadService } from './services/file-upload.service';
import appConfig from 'src/config/app.config';
import { Http2ServerRequest } from 'http2';
import { APIResponse, PaginatedAPIResponse } from '../../../types/api-response-v2.type';
import { APIResponseHelper } from '../../../common/helpers/api-response-v2.helper';

const prisma = new PrismaClient();

@Injectable()
export class ProductsService {

    constructor(
        private readonly fileUploadService: FileUploadService
    ) {}


    // get all products
    async getAllProducts(q: string, limit: number, page: number): Promise<PaginatedAPIResponse<Product>> {
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

            // Transform products with image URLs
            const productsWithImageUrl = products.map(product => ({
                ...product,
                imageUrl: product.image ? `${appConfig().app.url}/public/storage/${product.image}` : null
            }));
            console.log("productsWithImageUrl", productsWithImageUrl);

            return APIResponseHelper.paginated(
                productsWithImageUrl,
                totalCount,
                "Products data fetch successful",
                HttpStatus.OK,
                "PRODUCTS_FETCH_SUCCESS"
            );
        } catch (error) {
            if(error instanceof HttpException){
                throw error;
            }else{
                return APIResponseHelper.error(
                    error.message || 'Failed to fetch products',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'PRODUCTS_FETCH_ERROR'
                );
            }
        }
    }

    // get product by id
    async getProductById(id: string): Promise<APIResponse<any>> {
        try {
            if(!id){
                return APIResponseHelper.badRequest(
                    "Product ID is required",
                    "PRODUCT_ID_REQUIRED"
                );
            }
            
            const product = await prisma.product.findUnique({
                where: {
                    id: id,
                },
            });
            
            if (!product) {
                return APIResponseHelper.notFound(
                    "Product not found",
                    "PRODUCT_NOT_FOUND"
                );
            }

            const productWithImageUrl = {
                ...product,
                imageUrl: product.image ? `${appConfig().app.url}/public/storage/product_image/${product.image.split('/').pop()}` : null
            };

            return APIResponseHelper.success(
                productWithImageUrl,
                "Product fetched successfully",
                HttpStatus.OK,
                "PRODUCT_FETCH_SUCCESS"
            );
        } catch (error) {
            return APIResponseHelper.error(
                error.message || 'Failed to fetch product',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'PRODUCT_FETCH_ERROR'
            );
        }
    }



    // create product
    async createProduct(product: CreateProductDto): Promise<APIResponse<any>> {
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

            const productWithImageUrl = {
                ...save,
                imageUrl: save.image ? `${appConfig().app.url}/public/storage/${save.image.split('/').pop()}` : null
            };

            return APIResponseHelper.success(
                productWithImageUrl,
                "Product created successfully",
                HttpStatus.CREATED,
                "PRODUCT_CREATE_SUCCESS"
            );
        } catch (error) {
            return APIResponseHelper.error(
                error.message || 'Failed to create product',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'PRODUCT_CREATE_ERROR'
            );
        }
    }

    async updateProductById(id: string, product: UpdateProductDto): Promise<APIResponse<any>> {
        try {
            if (!id) {
                return APIResponseHelper.badRequest(
                    "Invalid product ID",
                    "INVALID_PRODUCT_ID"
                );
            }

            // Check if product exists
            const existingProduct = await prisma.product.findUnique({
                where: { id },
            });

            if (!existingProduct) {
                return APIResponseHelper.notFound(
                    "Product not found",
                    "PRODUCT_NOT_FOUND"
                );
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

            const productWithImageUrl = {
                ...updatedProduct,
                imageUrl: updatedProduct.image ? `${appConfig().app.url}/public/storage/product_image/${updatedProduct.image.split('/').pop()}` : null
            };

            return APIResponseHelper.success(
                productWithImageUrl,
                "Product updated successfully",
                HttpStatus.OK,
                "PRODUCT_UPDATE_SUCCESS"
            );
        } catch (error) {
            return APIResponseHelper.error(
                error.message || 'Failed to update product',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'PRODUCT_UPDATE_ERROR'
            );
        }
    }


    async deleteProductById(id: string): Promise<APIResponse<null>> {
        try {
            if (!id) {
                return APIResponseHelper.badRequest(
                    "Invalid product ID",
                    "INVALID_PRODUCT_ID"
                );
            }

            // Check if product exists
            const product = await prisma.product.findUnique({
                where: { id },
            });

            if (!product) {
                return APIResponseHelper.notFound(
                    "Product not found",
                    "PRODUCT_NOT_FOUND"
                );
            }

            // Delete associated image if exists
            if (product.image) {
                await this.fileUploadService.deleteProductImage(product.image);
            }

            // Delete the product
            await prisma.product.delete({
                where: { id },
            });

            return APIResponseHelper.success(
                null,
                "Product deleted successfully",
                HttpStatus.OK,
                "PRODUCT_DELETE_SUCCESS"
            );
        } catch (error) {
            return APIResponseHelper.error(
                error.message || 'Failed to delete product',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'PRODUCT_DELETE_ERROR'
            );
        }
    }

}



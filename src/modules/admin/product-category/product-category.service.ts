import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient, ProductCategory } from '@prisma/client';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CreateCategoryDto } from './dtos/create-category.to';
import { CategoryFileUploadService } from './services/category-file-upload.service';
import appConfig from 'src/config/app.config';
import { ApiResponse } from '../../../types/api-response.type';
import { ApiResponseHelper } from '../../../common/helpers/api-response.helper';

const prisma = new PrismaClient();

@Injectable()
export class ProductCategoryService {
    constructor(
        private readonly categoryFileUploadService: CategoryFileUploadService
    ) {}

    async getAllProductCategories(): Promise<ApiResponse<ProductCategory[]>> {
        try {
            const productCategories = await prisma.productCategory.findMany({
                orderBy: {
                    created_at: 'desc'
                }
            });
            
            // Add imageUrl to each category
            const categoriesWithImageUrl = productCategories.map(category => ({
                ...category,
                imageUrl: category.image ? `${appConfig().app.url}/public/storage/${category.image}` : null
            }));
            
            return ApiResponseHelper.success(
                categoriesWithImageUrl,
                "Categories fetched successfully",
                HttpStatus.OK,
                "CATEGORIES_FETCH_SUCCESS"
            );
        } catch (error) {
            return ApiResponseHelper.error(
                error.message || 'Failed to fetch categories',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'CATEGORIES_FETCH_ERROR'
            );
        }
    }

    async getProductCategoryById(id: string): Promise<ApiResponse<ProductCategory>> {
        try {
            if (!id) {
                return ApiResponseHelper.badRequest(
                    "Category ID is required",
                    "CATEGORY_ID_REQUIRED"
                );
            }

            const productCategory = await prisma.productCategory.findUnique({
                where: {
                    id: id,
                },
            });
            
            if (!productCategory) {
                return ApiResponseHelper.notFound(
                    "Product category not found",
                    "CATEGORY_NOT_FOUND"
                );
            }

            const categoryWithImageUrl = {
                ...productCategory,
                imageUrl: productCategory.image ? `${appConfig().app.url}/public/storage/${productCategory.image}` : null
            };
            
            return ApiResponseHelper.success(
                categoryWithImageUrl,
                "Category fetched successfully",
                HttpStatus.OK,
                "CATEGORY_FETCH_SUCCESS"
            );
        } catch (error) {
            return ApiResponseHelper.error(
                error.message || 'Failed to fetch category',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'CATEGORY_FETCH_ERROR'
            );
        }
    }

    async createProductCategory(productCategory: CreateCategoryDto): Promise<ApiResponse<ProductCategory>> {
        try {
            // Check if category name already exists
            const existingCategory = await prisma.productCategory.findUnique({
                where: {
                    name: productCategory.name,
                },
            });
            
            if (existingCategory) {
                return ApiResponseHelper.error(
                    "Product category with this name already exists",
                    HttpStatus.CONFLICT,
                    "CATEGORY_NAME_EXISTS"
                );
            }

            let imageUrl = null;
            
            // Handle image upload if provided
            if (productCategory.image) {
                imageUrl = await this.categoryFileUploadService.uploadCategoryImage(productCategory.image);
            }

            const newProductCategory = await prisma.productCategory.create({
                data: {
                    name: productCategory.name,
                    description: productCategory.description,
                    image: imageUrl,
                    icon: productCategory.icon,
                    color: productCategory.color,
                },
            });

            const categoryWithImageUrl = {
                ...newProductCategory,
                imageUrl: newProductCategory.image ? `${appConfig().app.url}/public/storage/${newProductCategory.image}` : null
            };
            
            return ApiResponseHelper.success(
                categoryWithImageUrl,
                "Category created successfully",
                HttpStatus.CREATED,
                "CATEGORY_CREATE_SUCCESS"
            );
        } catch (error) {
            return ApiResponseHelper.error(
                error.message || 'Failed to create category',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'CATEGORY_CREATE_ERROR'
            );
        }
    }

    async updateProductCategoryById(productCategory: UpdateCategoryDto, id: string): Promise<ApiResponse<ProductCategory>> {
        try {
            if (!id) {
                return ApiResponseHelper.badRequest(
                    "Invalid product category ID",
                    "INVALID_CATEGORY_ID"
                );
            }

            // Check if the product category exists
            const existingCategory = await prisma.productCategory.findUnique({
                where: { id },
            });

            if (!existingCategory) {
                return ApiResponseHelper.notFound(
                    "Product category not found",
                    "CATEGORY_NOT_FOUND"
                );
            }

            // Check if new name conflicts with existing category
            if (productCategory.name && productCategory.name !== existingCategory.name) {
                const nameExists = await prisma.productCategory.findUnique({
                    where: { name: productCategory.name },
                });
                
                if (nameExists) {
                    return ApiResponseHelper.error(
                        "Product category with this name already exists",
                        HttpStatus.CONFLICT,
                        "CATEGORY_NAME_EXISTS"
                    );
                }
            }

            // Build updateData object dynamically
            const updateData: any = {};
            if (productCategory.name !== undefined) updateData.name = productCategory.name;
            if (productCategory.description !== undefined) updateData.description = productCategory.description;
            if (productCategory.icon !== undefined) updateData.icon = productCategory.icon;
            if (productCategory.color !== undefined) updateData.color = productCategory.color;

            // Handle image upload if new image is provided
            if (productCategory.image) {
                // Delete old image if exists
                if (existingCategory.image) {
                    await this.categoryFileUploadService.deleteCategoryImage(existingCategory.image);
                }
                
                // Upload new image
                const imageUrl = await this.categoryFileUploadService.uploadCategoryImage(productCategory.image);
                updateData.image = imageUrl;
            }

            // Update product category
            const updatedCategory = await prisma.productCategory.update({
                where: { id },
                data: updateData,
            });

            const categoryWithImageUrl = {
                ...updatedCategory,
                imageUrl: updatedCategory.image ? `${appConfig().app.url}/public/storage/${updatedCategory.image}` : null
            };

            return ApiResponseHelper.success(
                categoryWithImageUrl,
                "Category updated successfully",
                HttpStatus.OK,
                "CATEGORY_UPDATE_SUCCESS"
            );
        } catch (error) {
            return ApiResponseHelper.error(
                error.message || 'Failed to update category',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'CATEGORY_UPDATE_ERROR'
            );
        }
    }

    async deleteProductCategoryById(id: string): Promise<ApiResponse<null>> {
        try {
            if (!id) {
                return ApiResponseHelper.badRequest(
                    "Invalid product category ID",
                    "INVALID_CATEGORY_ID"
                );
            }

            // Check if the product category exists
            const category = await prisma.productCategory.findUnique({
                where: { id },
            });

            // check  for the associated product in the product table 
            if (!category) {
                return ApiResponseHelper.notFound(
                    "Product category not found",
                    "CATEGORY_NOT_FOUND"
                );
            }

            const product = await prisma.product.findMany({
                where: {
                    category: {
                        id: id,
                    },
                },
            });
            for(const p of product){
                await prisma.product.update({
                    where: {
                        id: p.id,
                    },
                    data: {
                        categoryId: null,
                    },
                });
            }

            // Delete associated image if exists
            if (category.image) {
                await this.categoryFileUploadService.deleteCategoryImage(category.image);
            }

            // Delete the product category
            await prisma.productCategory.delete({
                where: { id },
            });

            return ApiResponseHelper.success(
                null,
                "Category deleted successfully",
                HttpStatus.OK,
                "CATEGORY_DELETE_SUCCESS"
            );
        } catch (error) {
            return ApiResponseHelper.error(
                error.message || 'Failed to delete category',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'CATEGORY_DELETE_ERROR'
            );
        }
    }

    
}

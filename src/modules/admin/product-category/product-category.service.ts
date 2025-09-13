import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CreateCategoryDto } from './dtos/create-category.to';
import { CategoryFileUploadService } from './services/category-file-upload.service';
import appConfig from 'src/config/app.config';

const prisma = new PrismaClient();

@Injectable()
export class ProductCategoryService {
    constructor(
        private readonly categoryFileUploadService: CategoryFileUploadService
    ) {}

    async getAllProductCategories() {
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
            
            return {
                success: true,
                message: "Categories fetched successfully",
                data: categoriesWithImageUrl
            };
        } catch (error) {
            throw new HttpException({
                success: false,
                message: error.message,
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getProductCategoryById(id: string) {
        try {
            if (!id) {
                throw new HttpException({
                    success: false,
                    message: "Category ID is required",
                }, HttpStatus.BAD_REQUEST);
            }

            const productCategory = await prisma.productCategory.findUnique({
                where: {
                    id: id,
                },
            });
            
            if (!productCategory) {
                throw new HttpException({
                    success: false,
                    message: "Product category not found",
                }, HttpStatus.NOT_FOUND);
            }
            
            return {
                success: true,
                message: "Category fetched successfully",
                data: {
                    ...productCategory,
                    imageUrl: productCategory.image ? `${appConfig().app.url}/public/storage/${productCategory.image}` : null
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    async createProductCategory(productCategory: CreateCategoryDto) {
        try {
            // Check if category name already exists
            const existingCategory = await prisma.productCategory.findUnique({
                where: {
                    name: productCategory.name,
                },
            });
            
            if (existingCategory) {
                throw new HttpException({
                    success: false,
                    message: "Product category with this name already exists",
                }, HttpStatus.CONFLICT);
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
            
            return {
                success: true,
                message: "Category created successfully",
                data: {
                    ...newProductCategory,
                    imageUrl: newProductCategory.image ? `${appConfig().app.url}/public/storage/${newProductCategory.image}` : null
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    async updateProductCategoryById(productCategory: UpdateCategoryDto, id: string) {
        try {
            if (!id) {
                throw new HttpException({
                    success: false,
                    message: "Invalid product category ID",
                }, HttpStatus.BAD_REQUEST);
            }

            // Check if the product category exists
            const existingCategory = await prisma.productCategory.findUnique({
                where: { id },
            });

            if (!existingCategory) {
                throw new HttpException({
                    success: false,
                    message: "Product category not found",
                }, HttpStatus.NOT_FOUND);
            }

            // Check if new name conflicts with existing category
            if (productCategory.name && productCategory.name !== existingCategory.name) {
                const nameExists = await prisma.productCategory.findUnique({
                    where: { name: productCategory.name },
                });
                
                if (nameExists) {
                    throw new HttpException({
                        success: false,
                        message: "Product category with this name already exists",
                    }, HttpStatus.CONFLICT);
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

            return {
                success: true,
                message: "Category updated successfully",
                data: {
                    ...updatedCategory,
                    imageUrl: updatedCategory.image ? `${appConfig().app.url}/public/storage/${updatedCategory.image}` : null
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    async deleteProductCategoryById(id: string) {
        try {
            if (!id) {
                throw new HttpException({
                    success: false,
                    message: "Invalid product category ID",
                }, HttpStatus.BAD_REQUEST);
            }

            // Check if the product category exists
            const category = await prisma.productCategory.findUnique({
                where: { id },
            });

            if (!category) {
                throw new HttpException({
                    success: false,
                    message: "Product category not found",
                }, HttpStatus.NOT_FOUND);
            }

            // Delete associated image if exists
            if (category.image) {
                await this.categoryFileUploadService.deleteCategoryImage(category.image);
            }

            // Delete the product category
            const deletedCategory = await prisma.productCategory.delete({
                where: { id },
            });

            return {
                success: true,
                message: "Category deleted successfully",
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new HttpException({
                    success: false,
                    message: error.message,
                }, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    
}

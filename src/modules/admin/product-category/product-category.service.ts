import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { updateVehicleErrors } from 'aws-sdk/clients/iotfleetwise';
import { UpdateCategoryDto } from './dtos/update-category.dto';

const prisma = new PrismaClient();

@Injectable()
export class ProductCategoryService {
    constructor() {}

    async getAllProductCategories() {
    const productCategories = await prisma.productCategory.findMany();
        return productCategories;
    }

    async getProductCategoryById(id: string) {
        try {
            const productCategory = await prisma.productCategory.findUnique({
                where: {
                    id: id,
                },
            });
            if (!productCategory) {
                return "Product category not found";
            }
            return productCategory;
        } catch (error) {
            throw error;
        }
    }

    async createProductCategory(productCategory: any) {
        try {
            const findcatName = await prisma.productCategory.findUnique({
                where: {
                    name: productCategory.name,
                },
            });
            if (findcatName) {
                return "Product category already exists";
            }
            const newProductCategory = await prisma.productCategory.create({
                data: productCategory,
            });
            return newProductCategory;
        } catch (error) {
            throw error;
        }
    }

    async updateProductCategoryById(productCategory: UpdateCategoryDto, id: string) {
        try {
            if (!id) {
                return "Invalid product category ID";
            }

            // Check if the product category exists
            const existingCategory = await prisma.productCategory.findUnique({
                where: { id },
            });

            if (!existingCategory) {
                return "Product category not found";
            }

            // Build updateData object dynamically
            const updateData: any = {};
            if (productCategory.name !== undefined) updateData.name = productCategory.name;
            if (productCategory.description !== undefined) updateData.description = productCategory.description;
            if (productCategory.image !== undefined) updateData.image = productCategory.image;

            // Update product category
            const updatedCategory = await prisma.productCategory.update({
                where: { id },
                data: updateData,
            });

            return updatedCategory;
        } catch (error) {
            throw error;
        }
    }

    async deleteProductCategoryById(id: string) {
        try {
            if (!id) {
                return "Invalid product category ID";
            }

            // Check if the product category exists
            const category = await prisma.productCategory.findUnique({
                where: { id },
            });

            if (!category) {
                return "Product category not found";
            }

            // Delete the product category
            const deletedCategory = await prisma.productCategory.delete({
                where: { id },
            });

            return deletedCategory;
        } catch (error) {
            throw error;
        }
    }

    
}

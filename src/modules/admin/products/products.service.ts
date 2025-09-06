import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { PrismaClient } from '@prisma/client';
import { UpdateProductDto } from './dtos/update-product.dtos';

const prisma = new PrismaClient();

@Injectable()
export class ProductsService {

    constructor() {}


    // get all products
    async getAllProducts() {
        const products = await prisma.product.findMany();
        return products;
    }

    // get product by id
    async getProductById(id: string) {

        try {
            const product = await prisma.product.findUnique({
                where: {
                    id: id,
                },
            });
            if (!product) {
                return "Product not found";
            }
            return product;
        } catch (error) {
            throw error;
        }
    }



    // create product
    async createProduct(product: CreateProductDto) {
        try {
            const save = await prisma.product.create({
                data: {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: product.image,
                    category: product.category,
                    quantity: Number(product.quantity), // Use Number for conversion
                },
            });
            return save; // Return inside try block
        } catch (error) {
            throw error;
        }
    }

    async updateProductById(id: string, product: UpdateProductDto) {
        try {
                if (!id) {
                    return "Invalid product ID";
                }

                // Check if product exists
                const existingProduct = await prisma.product.findUnique({
                    where: { id },
                });

                if (!existingProduct) {
                    return "Product not found";
                }

                // Build updateData object dynamically
                const updateData: any = {};
                if (product.name !== undefined) updateData.name = product.name;
                if (product.description !== undefined) updateData.description = product.description;
                if (product.price !== undefined) updateData.price = product.price;
                if (product.image !== undefined) updateData.image = product.image;
                if (product.category !== undefined) updateData.category = product.category;
                if (product.quantity !== undefined) updateData.quantity = Number(product.quantity);

                // Update product
                const updatedProduct = await prisma.product.update({
                where: { id },
                data: updateData,
                });

                return updatedProduct;
            } catch (error) {
            throw error;
        }
    }


    async deleteProductById(id: string) {
    try {
        if (!id) {
        return "Invalid product ID";
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
        where: { id },
        });

        if (!product) {
        return "Product not found";
        }

        // Delete the product
        const deletedProduct = await prisma.product.delete({
        where: { id },
        });

        return deletedProduct;
    } catch (error) {
        throw error;
    }
}

}



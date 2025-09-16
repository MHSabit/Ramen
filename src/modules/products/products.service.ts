import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import appConfig from 'src/config/app.config';
import { ApiResponse } from '../../types/api-response.type';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

const prisma = new PrismaClient();
@Injectable()
export class ProductsService {

  async findAll(): Promise<ApiResponse<any[]>> {
    try {
      // get all products from the products table but we have to send the popular products first then the new added products
      const products = await prisma.product.findMany({
        where: {
          popular: true
        },
        orderBy: {
          created_at: 'desc',
        },
      });
      const newProducts = await prisma.product.findMany({
        where: {
          popular: false
        },
        orderBy: {
          created_at: 'desc',
        },
      });
      // we have to return only 18 products
      const allProducts = [...products, ...newProducts].slice(0, 18);
      
      // Add imageUrl to each product
      const productsWithImageUrl = allProducts.map(product => ({
        ...product,
        imageUrl: product.image ? `${appConfig().app.url}/public/storage/${product.image.split('/').pop()}` : null
      }));

      return ApiResponseHelper.success(
        productsWithImageUrl,
        "Products fetched successfully",
        HttpStatus.OK
      );
    } catch (error) {
      if(error instanceof HttpException){
        throw error;
      }else{
        return ApiResponseHelper.error(
          error.message || 'Failed to fetch products',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
    try {
      if (!id) {
        return ApiResponseHelper.badRequest("Product ID is required");
      }

      const product = await prisma.product.findUnique({
        where: {
          id: id,
        },
      });

      if (!product) {
        return ApiResponseHelper.notFound("Product not found");
      }

      const productWithImageUrl = {
        ...product,
        imageUrl: product.image ? `${appConfig().app.url}/public/storage/${product.image.split('/').pop()}` : null
      };

      return ApiResponseHelper.success(
        productWithImageUrl,
        "Product fetched successfully",
        HttpStatus.OK
      );
    } catch (error) {
      if(error instanceof HttpException){
        throw error;
      }else{
        return ApiResponseHelper.error(
          error.message || 'Failed to fetch product',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

}

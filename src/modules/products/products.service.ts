import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import appConfig from 'src/config/app.config';

const prisma = new PrismaClient();
@Injectable()
export class ProductsService {

  async findAll() {
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

      return {
        success: true,
        message: "Products fetched successfully",
        data: productsWithImageUrl,
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

  async findOne(id: string) {
    try {
      const product = await prisma.product.findUnique({
        where: {
          id: id,
        },
      });
      return {
        success: true,
        message: "Product fetched successfully",
        data: {
          ...product,
          imageUrl: product.image ? `${appConfig().app.url}/public/storage/${product.image.split('/').pop()}` : null
        },
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

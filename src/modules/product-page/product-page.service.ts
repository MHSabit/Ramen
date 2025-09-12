import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductPageDto } from './dto/create-product-page.dto';
import { UpdateProductPageDto } from './dto/update-product-page.dto';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

@Injectable()
export class ProductPageService {
  create(createProductPageDto: CreateProductPageDto) {
    return 'This action adds a new productPage';
  }

  // Get all product pages
  async findAll(q: string, limit: string, page: string) {
    try {
      const where_condition = {};
      if(q){
          where_condition['OR'] = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ];
      }
      const pageNumber = page ? parseInt(page, 10) : 1;
      const limitNumber = limit ? parseInt(limit, 10) : 10;
      const productPages = await prisma.product.findMany({
        where: where_condition,
        take: limitNumber,
        skip: (pageNumber - 1) * limitNumber,
        orderBy: {
          created_at: 'desc',
        },
      });
      const totalCount = await prisma.product.count({
        where: where_condition,
      });
      const totalPages = Math.ceil(totalCount / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;
      return {
        success: true,
        data: {
          productPages,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalCount,
            limit: limitNumber,
            hasNextPage,
            hasPrevPage,
          },
        },
      };
      }
    catch (error) {
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

  // Get product page by id
  async findOne(id: string) {
    try {
      const productPage = await prisma.product.findUnique({
        where: {
          id: id,
        },
      });
      if(!productPage){
        throw new HttpException({
          success: false,
          message: "Product page not found",
        }, HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        message: "Product page fetched successfully",
        data: productPage,
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




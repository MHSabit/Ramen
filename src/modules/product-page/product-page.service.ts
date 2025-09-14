import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductPageDto } from './dto/create-product-page.dto';
import { UpdateProductPageDto } from './dto/update-product-page.dto';
import { PrismaClient } from '@prisma/client';
import appConfig from 'src/config/app.config';
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

       // Add imageUrl to each category
       const productPagesWithImageUrl = productPages.map(productPage => ({
        ...productPage,
        imageUrl: productPage.image ? `${appConfig().app.url}/public/storage/${productPage.image}` : null
    }));

      return {
        success: true,
        message: "Product pages fetched successfully",
        data: {
          productPagesWithImageUrl,
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

 
}




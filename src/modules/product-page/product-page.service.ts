import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductPageDto } from './dto/create-product-page.dto';
import { UpdateProductPageDto } from './dto/update-product-page.dto';
import { PrismaClient, Product } from '@prisma/client';
import appConfig from 'src/config/app.config';
import { PaginatedAPIResponse } from '../../types/api-response-v2.type';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
const prisma = new PrismaClient();

@Injectable()
export class ProductPageService {
  // Get all product pages
  async findAll(q: string, limit: string, page: string): Promise<PaginatedAPIResponse<Product>> {
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

       // Add imageUrl to each product page
       const productPagesWithImageUrl = productPages.map(productPage => ({
        ...productPage,
        imageUrl: productPage.image ? `${appConfig().app.url}/public/storage/${productPage.image}` : null
    }));

      return ApiResponseHelper.paginated(
        productPagesWithImageUrl,
        totalCount,
        "Product pages fetched successfully",
        HttpStatus.OK
      );
    }
    catch (error) {
      if(error instanceof HttpException){
        throw error;
      }else{
        return ApiResponseHelper.error(
          error.message || 'Failed to fetch product pages',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

 
}




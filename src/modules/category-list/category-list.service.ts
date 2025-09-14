import { HttpStatus, HttpException, Injectable } from '@nestjs/common';  
import { PrismaClient } from '@prisma/client';
import appConfig from 'src/config/app.config';

const prisma = new PrismaClient();

@Injectable()
export class CategoryListService {

  async findAll() {
    try {
      const categoryList = await prisma.productCategory.findMany();
      if(!categoryList){
        throw new HttpException({
          success: false,
          message: "Category list not found",
        }, HttpStatus.NOT_FOUND);
      }
       // Add imageUrl to each category
       const categoriesWithImageUrl = categoryList.map(category => ({
        ...category,
        imageUrl: category.image ? `${appConfig().app.url}/public/storage/${category.image}` : null
    }));
      
      return {
        success: true,
        message: "Category list fetched successfully",
        data: categoriesWithImageUrl,
      };
    } catch (error) {
      throw new HttpException({
        success: false,
        message: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: string, limit: string, page: string, q: string) {
    try {
      // get product in category by id
      const where_condition: any = {};
      if(q){
        where_condition['OR'] = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
      const pageNumber = page ? parseInt(page, 10) : 1;
      const limitNumber = limit ? parseInt(limit, 10) : 10;
      const categoryList = await prisma.product.findMany({
      where: {
        categoryId: id,
        ...where_condition,
      },
      take: limitNumber,
      skip: (pageNumber - 1) * limitNumber,
      orderBy: {
        created_at: 'desc',
      }
    });

    const totalCount = await prisma.product.count({
      where: {
        categoryId: id,
      }
    });
    if(!categoryList){
      throw new HttpException({
        success: false,
        message: "No Product in Category found",
      }, HttpStatus.NOT_FOUND);
    }
    // Add imageUrl to each product
    const productsWithImageUrl = categoryList.map(product => ({
      ...product,
      imageUrl: product.image ? `${appConfig().app.url}/public/storage/${product.image}` : null
    }));

    return {
      success: true,
      message: "Category list fetched successfully",
      data: {
        productsWithImageUrl,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          totalCount,
          limit: limitNumber
        },
      },
    };
    } catch (error) {
      throw new HttpException({
        success: false,
        message: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}

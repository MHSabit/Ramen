import { HttpStatus, HttpException, Injectable } from '@nestjs/common';  
import { PrismaClient } from '@prisma/client';
import appConfig from 'src/config/app.config';
import { ApiResponse } from '../../types/api-response.type';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

const prisma = new PrismaClient();

@Injectable()
export class CategoryListService {

  async findAll(): Promise<ApiResponse<any>> {
    try {
      const categoryList = await prisma.productCategory.findMany();
      if(!categoryList){
        return ApiResponseHelper.notFound('Category list not found', 'CATEGORY_LIST_NOT_FOUND');
      }
       // Add imageUrl to each category
       // Pre-compute product counts grouped by categoryId (ignoring NULLs)
       const groupedCounts = await prisma.product.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
        where: {
          categoryId: { not: null },
        },
       });
       const countByCategoryId = new Map<string, number>();
       groupedCounts.forEach((g: any) => {
        if (g.categoryId) countByCategoryId.set(g.categoryId, g._count._all);
       });

       const categoriesWithImageUrl = categoryList.map(category => ({
        ...category,
        imageUrl: category.image ? `${appConfig().app.url}/public/storage/${category.image}` : null,
        productsCount: countByCategoryId.get(category.id) ?? 0,
      }));
      
      return ApiResponseHelper.success(
        categoriesWithImageUrl,
        'Category list fetched successfully',
        HttpStatus.OK,
        'CATEGORY_LIST_FETCH_SUCCESS'
      );
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to fetch category list',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'CATEGORY_LIST_FETCH_ERROR'
      );
    }
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
    try {
      // get product in category by id
      const where_condition: any = {};
      const category = await prisma.productCategory.findUnique({
        where: {
          id: id,
        },
      });
      if(!category){
        return ApiResponseHelper.notFound('Category not found', 'CATEGORY_NOT_FOUND');
      }
      const productList = await prisma.product.findMany({
      where: {
        categoryId: id,
        ...where_condition,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      }
      
    });

    const totalCount = await prisma.product.count({
      where: {
        categoryId: id,
      }
    });
    if(!productList || productList.length === 0){
      return ApiResponseHelper.notFound('No Product in Category found', 'CATEGORY_PRODUCTS_NOT_FOUND');
    }
    // Add imageUrl to each product
    const productsWithImageUrl = productList.map(product => ({
      ...product,
      imageUrl: product.image ? `${appConfig().app.url}/public/storage/${product.image}` : null,
      category: product.category ? { id: product.category.id, name: product.category.name } : null,
    }));

    return ApiResponseHelper.success(
      {
        category: {...category, imageUrl: category.image ? `${appConfig().app.url}/public/storage/${category.image}` : null, totalCount: totalCount},
        productsWithImageUrl,
      },
      'products by category fetched successfully',
      HttpStatus.OK,
      'CATEGORY_PRODUCTS_FETCH_SUCCESS'
    );
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to fetch category products',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'CATEGORY_PRODUCTS_FETCH_ERROR'
      );
    }
  }

}

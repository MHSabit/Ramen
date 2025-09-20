import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient, Product } from '@prisma/client';
import appConfig from 'src/config/app.config';
import { ApiResponse } from '../../types/api-response.type';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

const prisma = new PrismaClient();
@Injectable()
export class ProductsService {

  async findAll(): Promise<ApiResponse<Product[]>> {
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
        include: {
          category: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      if (!product) {
        return ApiResponseHelper.notFound("Product not found");
      }

      const productWithImageUrl = {
        ...product,
        imageUrl: product.image ? `${appConfig().app.url}/public/storage/${product.image.split('/').pop()}` : null,
        category: product.category ? { id: product.category.id, name: product.category.name } : null,
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

  async getRelatedProducts(productId: string): Promise<ApiResponse<Product[]>> {
    try {
      if (!productId) {
        return ApiResponseHelper.badRequest('Product ID is required');
      }

      const base = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, categoryId: true },
      });

      if (!base) {
        return ApiResponseHelper.notFound('Product not found');
      }

      let related: Product[] = [];

      if (base.categoryId) {
        related = await prisma.product.findMany({
          where: {
            categoryId: base.categoryId,
            id: { not: base.id },
          },
          orderBy: { created_at: 'desc' },
          take: 3,
        });
      }

      if (!base.categoryId || related.length === 0) {
        // fallback to 3 random products excluding current
        const candidates = await prisma.product.findMany({
          where: { id: { not: base.id } },
          take: 20, // fetch a chunk, then sample
          orderBy: { created_at: 'desc' },
        });
        // simple shuffle and take 3
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        related = candidates.slice(0, 3);
      }

      const relatedWithImage = related.map((p) => ({
        ...p,
        imageUrl: p.image ? `${appConfig().app.url}/public/storage/${p.image.split('/').pop()}` : null,
      }));

      return ApiResponseHelper.success(
        relatedWithImage,
        'Related products fetched successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return ApiResponseHelper.error(
        error.message || 'Failed to fetch related products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

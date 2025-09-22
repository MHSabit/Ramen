import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../../../types/api-response.type';
import { ApiResponseHelper } from '../../../common/helpers/api-response.helper';

const prisma = new PrismaClient();


@Injectable()

export class DashboardService {
    private prisma: PrismaClient;  // Declare prisma as a property of the class

    constructor() {
        this.prisma = new PrismaClient();
    }
    async getTtotalProductsCount(): Promise<ApiResponse<any>> {
        try {
            const totalProducts = await this.prisma.product.count();
            const totalCategories = await this.prisma.productCategory.count();
            const totalGroupedOrders = await this.prisma.orderItem.groupBy({
                by: ['transaction_id']
              });
            const totalOrders = totalGroupedOrders.length;
            const totalUsers = await this.prisma.user.count();
            const result = await this.prisma.paymentTransaction.aggregate({
                _sum: { amount: true },
            });
            const totalGroupedTransactions = await this.prisma.paymentTransaction.groupBy({
                by: ['id']
            });
            const totalTransactions = totalGroupedTransactions.length;
            const totalRevenue = result._sum.amount;

            return ApiResponseHelper.success(
                {
                    totalProducts,
                    totalCategories,
                    totalOrders,
                    totalUsers,
                    totalRevenue,
                    totalTransactions,
                },
                'Dashboard data fetched successfully',
                HttpStatus.OK,
                'DASHBOARD_FETCH_SUCCESS'
            );
        } catch (error) {
            return ApiResponseHelper.error(
                error.message || 'Failed to fetch dashboard data',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'DASHBOARD_FETCH_ERROR'
            );
        }
    }
    
        
    
    
}

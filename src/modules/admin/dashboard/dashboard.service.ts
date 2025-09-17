import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


@Injectable()

export class DashboardService {
    private prisma: PrismaClient;  // Declare prisma as a property of the class

    constructor() {
        this.prisma = new PrismaClient();
    }
    async getTtotalProductsCount() {
        const totalProducts = await this.prisma.product.count();
        const totalCategories = await this.prisma.productCategory.count();
        const totalOrders = await this.prisma.orderItem.count();
        const totalUsers =await this.prisma.user.count();
        const result = await this.prisma.paymentTransaction.aggregate({
           _sum: {
               amount: true,
           },
       });
    
       const totalRevenue = result._sum.amount;

       return {
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
            totalProducts,
            totalCategories,
            totalOrders,
            totalUsers,
            totalRevenue,
        },
       }
    }
    
        
    
    
}

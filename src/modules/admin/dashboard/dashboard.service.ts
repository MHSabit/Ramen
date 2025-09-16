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
        return totalProducts;
    }
    
        
    async getTotalCategoriesCount() {
        const totalCategories = await this.prisma.productCategory.count();
        return totalCategories;

    }
    
    async getTotalOrderCount() {
        const totalOrders = await this.prisma.orderItem.count();
        return totalOrders;

    }
    
    async getTotalUsersCount() {
        const totalUsers =await this.prisma.user.count();
        return totalUsers;

    }
    
    async getTotalRevenue() {
         const result = await this.prisma.paymentTransaction.aggregate({
            _sum: {
                amount: true,
            },
        });

        const totalRevenue = result._sum.amount;
        return totalRevenue;
    }
    
}

import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('admin/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('total-products-count')
    async getTtotalProductsCount() {
        return await this.dashboardService.getTtotalProductsCount();
    }

    @Get('total-categories-count')
    async getTotalCategoriesCount() {
        return await this.dashboardService.getTotalCategoriesCount();
    }

    @Get('total-orders-count')  
    async getTotalOrderCount() {
        return await this.dashboardService.getTotalOrderCount();
    }

    @Get('total-users-count')
    async getTotalUsersCount() {
        return await this.dashboardService.getTotalUsersCount();
    }

    @Get('total-revenue')
    async getTotalRevenue() {
        return await this.dashboardService.getTotalRevenue();
    }

}

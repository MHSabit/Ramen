import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('user/dashboard')
@UseGuards(JwtAuthGuard)
export class UserDashboardController {
  constructor(private readonly userDashboardService: UserDashboardService) {}

  @Get('all-orders')
  async findAll(@Req() req: Request) {
    const user_id = req.user.userId;
    return await this.userDashboardService.findAll(user_id);
  }

  @Get('all-order-transactions')
  async findAllOrderTransactions(@Req() req: Request) {
    const user_id = req.user.userId;  
    return await this.userDashboardService.findAllOrderTransactions(user_id);
  }
}

import { Controller, Get, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { PaymentTransactionService } from './payment-transaction.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Payment transaction')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/payment-transaction')
export class PaymentTransactionController {
  constructor(
    private readonly paymentTransactionService: PaymentTransactionService,
  ) {}

  @ApiOperation({ summary: 'Get all transactions' })
  @Get()
  async findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    const paymentTransactions = await this.paymentTransactionService.findAll(
      pageNumber,
      limitNumber,
    );

    return paymentTransactions;
  }

  @ApiOperation({ summary: 'Get one transaction' })
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;

      const paymentTransaction = await this.paymentTransactionService.findOne(
        id,
        user_id,
      );

      return paymentTransaction;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;

      const paymentTransaction = await this.paymentTransactionService.remove(
        id,
        user_id,
      );

      return paymentTransaction;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

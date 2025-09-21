import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, HttpException, HttpStatus } from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';
import { SkipTransform } from 'src/common/decorators/skip-transform.decorator';
import { Request } from 'express';

@Controller('admin/order-items')
@ApiTags('Order Items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  // get all order items with pagination, search  by name and limit and page
  @Get()
    @SkipTransform()
    @ApiOperation({ summary: 'Get all products with pagination and search' })
    async getAllOrders(
        @Req() req: Request,
        @Query('q') q?: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        // Set defaults: page = 1, limit = 10
        const pageNumber = page ? parseInt(page, 10) : 1;
        const limitNumber = limit ? parseInt(limit, 10) : 10;
        
        // Validate inputs
        if (pageNumber < 1) {
            throw new HttpException('Page must be greater than 0', HttpStatus.BAD_REQUEST);
        }
        if (limitNumber < 1 || limitNumber > 100) {
            throw new HttpException('Limit must be between 1 and 100', HttpStatus.BAD_REQUEST);
        }
        // console.log('req.user', req.user.userId);
        return await this.orderItemsService.getAllOrders(limitNumber, pageNumber, q);
    }


  // get order item by id
  @Get(':id')
  @ApiOperation({ summary: 'Get order item by id' })
  async getOrderItemById(@Param('id') id: string) {
    return await this.orderItemsService.getOrderItemById(id);
  }

  // update delivery status
  @Patch(':id/delivery-status')
  @ApiOperation({ summary: 'Update delivery status' })
  async updateDeliveryStatus(@Param('id') id: string, @Body() data: { delivery_status: string }) {
    console.log('data', data);
    return await this.orderItemsService.updateDeliveryStatus(id, data.delivery_status);
  }

}

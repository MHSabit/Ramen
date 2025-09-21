import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateUserDashboardDto } from './dto/create-user-dashboard.dto';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
import { PrismaClient } from '@prisma/client';
import { ApiResponseHelper } from 'src/common/helpers/api-response.helper';

const prisma = new PrismaClient();
@Injectable()
export class UserDashboardService {

  async findAll(user_id: string) {
    try {
      // Get all payment transactions (orders) for the specific user
      const userOrders = await prisma.paymentTransaction.findMany({
        where: {
          user_id: user_id
        },
        include: {
          order_items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc' // Order by newest first
        }
      });

      // Format the response to include all order details
      const formattedOrders = userOrders.map(order => {
        const items = order.order_items.map(item => ({
          id: item.id,
          product_name: item.product_name,
          product_id: item.product_id,
          product: item.product,
          quantity: item.quantity,
          unit_price: item.product_price,
          total_price: item.total_price,
          delivery_status: item.delivery_status || 'pending',
        }));

        const totalPrice = order.order_items.reduce((sum, item) => sum + item.total_price, 0);

        return {
          order_id: order.id,
          items: items,
          delivery_status: items[0].delivery_status || 'pending',
          total_price: totalPrice,
          status: order.status,
          created_at: order.created_at.toISOString().split('T')[0], // Format as YYYY-MM-DD
          created_at_full: order.created_at,
          transaction_details: {
            amount: order.amount,
            currency: order.currency,
            reference_number: order.reference_number,
            shipping_address: order.shipping_address,
            shipping_city: order.shipping_city,
            shipping_state: order.shipping_state,
            shipping_zip_code: order.shipping_zip_code,
            shipping_method: order.shipping_method,
            shipping_cost: order.shipping_cost,
            shipping_days: order.shipping_days,
          }
        };
      });

      return ApiResponseHelper.success(
        formattedOrders,
        "User orders fetched successfully",
        HttpStatus.OK,
        "USER_ORDERS_FETCH_SUCCESS"
      );

    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to fetch user orders',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'USER_ORDERS_FETCH_ERROR'
      );
    }
  }

  async findAllOrderTransactions(user_id: string) {
    try {
      const userOrders = await prisma.paymentTransaction.findMany({
        where: {
          user_id: user_id
        }
      });
      return ApiResponseHelper.success(
        userOrders,
        "User order transactions fetched successfully",
        HttpStatus.OK,
        "USER_ORDER_TRANSACTIONS_FETCH_SUCCESS"
      );
    }
    catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to fetch user order transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'USER_ORDER_TRANSACTIONS_FETCH_ERROR'
      );
    }
  }
}

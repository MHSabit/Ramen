import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { PrismaClient } from '@prisma/client';
import { ApiResponseHelper } from 'src/common/helpers/api-response.helper';
import appConfig from 'src/config/app.config';
import { HttpException } from '@nestjs/common';

const prisma = new PrismaClient();

@Injectable()
export class OrderItemsService {

  async getAllOrders(limit: number, page: number, q: string){
    try {   
      
        // Build where condition for search
        const where_condition: any = {};
        if(q){
            where_condition.OR = [
                {
                    transaction: {
                        user: {
                            name: {
                                contains: q,
                                mode: 'insensitive',
                            }
                        }
                    }
                },
                {
                    transaction: {
                        user: {
                            email: {
                                contains: q,
                                mode: 'insensitive',
                            }
                        }
                    }
                },
                {
                    product_name: {
                        contains: q,
                        mode: 'insensitive',
                    }
                }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get payment transactions (orders) with pagination and search
        const orders = await prisma.paymentTransaction.findMany({
            where: where_condition,
            take: limit,
            skip: skip,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                order_items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                created_at: 'desc' // Order by newest first
            }
        });
        
        const totalCount = await prisma.orderItem.groupBy({
          by: ['transaction_id'],      // group rows by transaction_id
          where: where_condition       // your existing condition
        });

        // Format the response to include all requested fields
        const formattedOrders = orders.map(order => {
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
                customer_name: order.user?.name || order.contact_first_name || 'N/A',
                customer_email: order.user?.email || order.contact_email || 'N/A',
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
                }
            };
        });

        return ApiResponseHelper.paginated(
            formattedOrders,
            totalCount.length,
            "Orders data fetch successful",
            HttpStatus.OK,
            "ORDERS_FETCH_SUCCESS"
        );
    } catch (error) {
        if(error instanceof HttpException){
            throw error;
        }else{
            return ApiResponseHelper.error(
                error.message || 'Failed to fetch orders',
                HttpStatus.INTERNAL_SERVER_ERROR,
                'ORDERS_FETCH_ERROR'
            );
        }
    }
}

  async getOrderItemById(id: string){
    try {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              spice_level: true,
              features: true,
              popular: true,
            },
          },
          transaction: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone_number: true,
                },
              },
            },
          },
        },
      });

      if(!orderItem){
        return ApiResponseHelper.notFound(
          "Order item not found",
          "ORDER_ITEM_NOT_FOUND"
        );
      }

      // Format the response to match the Order Details page structure exactly
      const formattedItem = {
        "Customer Information": {
          name: orderItem.transaction?.user?.name || orderItem.transaction?.contact_first_name || 'N/A',
          email: orderItem.transaction?.user?.email || orderItem.transaction?.contact_email || 'N/A',
          phone: orderItem.transaction?.user?.phone_number || orderItem.transaction?.contact_phone || 'Not provided',
        },
        "Shipping Address": {
          address: orderItem.transaction?.shipping_address || 'Not provided',
          city: orderItem.transaction?.shipping_city || 'Not provided',
          state: orderItem.transaction?.shipping_state || 'Not provided',
          zip_code: orderItem.transaction?.shipping_zip_code || 'Not provided',
        },
        "Order Items": [
          {
            product_name: orderItem.product_name,
            quantity: orderItem.quantity,
            price: orderItem.product_price,
            total_price: orderItem.total_price,
          }
        ],
        "Total": orderItem.total_price,
        "Order Status": orderItem.delivery_status || 'pending',
        "Order Summary": {
          order_date: orderItem.transaction?.created_at ? orderItem.transaction.created_at.toISOString().split('T')[0] : 'N/A',
          payment_method: 'Credit Card',
          shipping_method: orderItem.transaction?.shipping_method || 'Standard',
          tracking_number: orderItem.transaction?.reference_number || 'Not available',
        }
      };

      return ApiResponseHelper.success(
        formattedItem,
        "Order item fetched successfully",
        HttpStatus.OK,
        "ORDER_ITEM_FETCH_SUCCESS"
      );
    } catch (error) {
      if(error instanceof HttpException){
        throw error;
      } else {
        return ApiResponseHelper.error(
          error.message || 'Failed to fetch order item',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'ORDER_ITEM_FETCH_ERROR'
        );
      }
    }
  }


  async updateDeliveryStatus(id: string, delivery_status: string){
    const orderItem = await prisma.orderItem.updateMany({
      where: { transaction_id: id },
      data: { delivery_status: delivery_status },
    });
    return ApiResponseHelper.success(
      orderItem,
      "Delivery status updated successfully",
      HttpStatus.OK,
      "DELIVERY_STATUS_UPDATED_SUCCESS"
    );
  }
}

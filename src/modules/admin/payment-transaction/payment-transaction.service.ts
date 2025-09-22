import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { ApiResponseHelper } from 'src/common/helpers/api-response.helper';

@Injectable()
export class PaymentTransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [paymentTransactions, total] = await this.prisma.$transaction([
        this.prisma.paymentTransaction.findMany({
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            status: true,
            raw_status: true,
            provider: true,
            amount: true,
            currency: true,
            paid_amount: true,
            paid_currency: true,
            created_at: true,
            updated_at: true,
            user: {
              select: {
                email: true,
              },
            },
            // send order id from order_items
            order_items: {
              select: {
                id: true,
              },
            },
          },
        }),
        this.prisma.paymentTransaction.count(),
      ]);

      return ApiResponseHelper.paginated(
        paymentTransactions,
        total,
        'Payment transactions fetched successfully',
        HttpStatus.OK,
        'PAYMENT_TRANSACTIONS_FETCH_SUCCESS'
      );
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to get payment transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'PAYMENT_TRANSACTION_GET_ERROR'
      );
    }
  }

  async findOne(id: string, user_id?: string) {
    try {
      const userDetails = await UserRepository.getUserDetails(user_id);

      const whereClause = {};
      if (userDetails.type == 'vendor') {
        whereClause['user_id'] = user_id;
      }

      const paymentTransaction =
        await this.prisma.paymentTransaction.findUnique({
          where: {
            id: id,
            ...whereClause,
          },
          select: {
            id: true,
            reference_number: true,
            status: true,
            provider: true,
            amount: true,
            currency: true,
            paid_amount: true,
            paid_currency: true,
            created_at: true,
            updated_at: true,
          },
        });

      if (!paymentTransaction) {
        return {
          success: false,
          message: 'Payment transaction not found',
        };
      }

      return {
        success: true,
        data: paymentTransaction,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string, user_id?: string) {
    try {
      const userDetails = await UserRepository.getUserDetails(user_id);

      const whereClause = {};
      if (userDetails.type == 'vendor') {
        whereClause['user_id'] = user_id;
      }

      const paymentTransaction =
        await this.prisma.paymentTransaction.findUnique({
          where: {
            id: id,
            ...whereClause,
          },
        });

      if (!paymentTransaction) {
        return {
          success: false,
          message: 'Payment transaction not found',
        };
      }

      await this.prisma.paymentTransaction.delete({
        where: {
          id: id,
        },
      });

      return {
        success: true,
        message: 'Payment transaction deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

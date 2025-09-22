import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TransactionRepository {
  /**
   * Create transaction
   * @returns
   */
  static async createTransaction({
    user_id,
    amount,
    currency,
    reference_number,
    status = 'pending',
  }: {
    user_id: string;
    amount?: number;
    currency?: string;
    reference_number?: string;
    status?: string;
  }) {
    const data = {};
    if (user_id) {
      data['user_id'] = user_id;
    }
    if (amount) {
      data['amount'] = Number(amount);
    }
    if (currency) {
      data['currency'] = currency;
    }
    if (reference_number) {
      data['reference_number'] = reference_number;
    }
    if (status) {
      data['status'] = status;
    }
    return await prisma.paymentTransaction.create({
      data: {
        ...data,
      },
    });
  }

  /**
   * Update transaction by ID
   * @returns
   */
  static async updateTransactionById({
    id,
    reference_number,
    status = 'pending',
    paid_amount,
    paid_currency,
    raw_status,
  }: {
    id: string;
    reference_number?: string;
    status?: string;
    paid_amount?: number;
    paid_currency?: string;
    raw_status?: string;
  }) {
    const data = {};
    const order_data = {};
    if (status) {
      data['status'] = status;
      order_data['payment_status'] = status;
    }
    if (paid_amount) {
      data['paid_amount'] = Number(paid_amount);
      order_data['paid_amount'] = Number(paid_amount);
    }
    if (paid_currency) {
      data['paid_currency'] = paid_currency;
      order_data['paid_currency'] = paid_currency;
    }
    if (raw_status) {
      data['raw_status'] = raw_status;
      order_data['payment_raw_status'] = raw_status;
    }
    if (reference_number) {
      data['reference_number'] = reference_number;
    }

    return await prisma.paymentTransaction.update({
      where: {
        id: id,
      },
      data: {
        ...data,
      },
    });
  }

  /**
   * Update transaction by reference number
   * @returns
   */
  static async updateTransaction({
    reference_number,
    status = 'pending',
    paid_amount,
    paid_currency,
    raw_status,
  }: {
    reference_number: string;
    status: string;
    paid_amount?: number;
    paid_currency?: string;
    raw_status?: string;
  }) {
    const data = {};
    const order_data = {};
    if (status) {
      data['status'] = status;
      order_data['payment_status'] = status;
    }
    if (paid_amount) {
      data['paid_amount'] = Number(paid_amount);
      order_data['paid_amount'] = Number(paid_amount);
    }
    if (paid_currency) {
      data['paid_currency'] = paid_currency;
      order_data['paid_currency'] = paid_currency;
    }
    if (raw_status) {
      data['raw_status'] = raw_status;
      order_data['payment_raw_status'] = raw_status;
    }
    const paymentTransaction = await prisma.paymentTransaction.findMany({
      where: {
        reference_number: reference_number,
      },
    });

    // update booking status
    // if (paymentTransaction.length > 0) {
    //   await prisma.order.update({
    //     where: {
    //       id: paymentTransaction[0].order_id,
    //     },
    //     data: {
    //       ...order_data,
    //     },
    //   });
    // }
    return await prisma.paymentTransaction.updateMany({
      where: {
        reference_number: reference_number,
      },
      data: {
        ...data,
      },
    });
  }

  /**
   * Get transactions by user ID
   * @returns
   */
  static async getTransactionsByUserId(user_id: string) {
    return await prisma.paymentTransaction.findMany({
      where: {
        user_id: user_id,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  static async getTransactionById(id: string) {
    return await prisma.paymentTransaction.findUnique({
      where: {
        id: id,
      },
    });
  }

  /**
   * Get successful transactions by user ID
   * @returns
   */
  static async getSuccessfulTransactionsByUserId(user_id: string) {
    return await prisma.paymentTransaction.findMany({
      where: {
        user_id: user_id,
        status: 'succeeded',
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get transaction by reference number (Stripe session/payment intent ID)
   * @returns
   */
  static async getTransactionByReference(reference_number: string) {
    return await prisma.paymentTransaction.findFirst({
      where: {
        reference_number: reference_number,
      },
    });
  }
}

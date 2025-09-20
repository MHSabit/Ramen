import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import appConfig from '../config/app.config';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail-queue') private queue: Queue,
    private mailerService: MailerService,
  ) {}

  async sendMemberInvitation({ user, member, url }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = `${user.fname} is inviting you to ${appConfig().app.name}`;

      // add to queue
      await this.queue.add('sendMemberInvitation', {
        to: member.email,
        from: from,
        subject: subject,
        template: 'member-invitation',
        context: {
          user: user,
          member: member,
          url: url,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  // send otp code for email verification
  async sendOtpCodeToEmail({ name, email, otp }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = 'Email Verification';

      // add to queue
      await this.queue.add('sendOtpCodeToEmail', {
        to: email,
        from: from,
        subject: subject,
        template: 'email-verification',
        context: {
          name: name,
          otp: otp,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendVerificationLink(params: {
    email: string;
    name: string;
    token: string;
    type: string;
  }) {
    try {
      const verificationLink = `${appConfig().app.client_app_url}/verify-email?token=${params.token}&email=${params.email}&type=${params.type}`;

      // add to queue
      await this.queue.add('sendVerificationLink', {
        to: params.email,
        subject: 'Verify Your Email',
        template: './verification-link',
        context: {
          name: params.name,
          verificationLink,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Send order confirmation email to customer
  async sendOrderConfirmationEmail(params: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    orderDate: string;
    totalAmount: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      spice_level?: string;
    }>;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    shippingZipCode: string;
    shippingMethod: string;
    shippingDays: number;
  }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = `Order Confirmation - #${params.orderNumber}`;

      await this.queue.add('sendOrderConfirmation', {
        to: params.customerEmail,
        from: from,
        subject: subject,
        template: 'order-confirmation',
        context: {
          customerName: params.customerName,
          orderNumber: params.orderNumber,
          orderDate: params.orderDate,
          totalAmount: params.totalAmount.toFixed(2),
          items: params.items,
          shippingAddress: params.shippingAddress,
          shippingCity: params.shippingCity,
          shippingState: params.shippingState,
          shippingZipCode: params.shippingZipCode,
          shippingMethod: params.shippingMethod,
          shippingDays: params.shippingDays,
        },
      });
    } catch (error) {
      console.log('Error sending order confirmation email:', error);
    }
  }

  // Send order notification email to admin
  async sendAdminOrderNotification(params: {
    adminEmail: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerId: string;
    orderNumber: string;
    orderDate: string;
    totalAmount: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      spice_level?: string;
    }>;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    shippingZipCode: string;
    shippingMethod: string;
    shippingDays: number;
    adminDashboardUrl: string;
  }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = `New Order Alert - #${params.orderNumber} - $${params.totalAmount.toFixed(2)}`;

      await this.queue.add('sendAdminOrderNotification', {
        to: params.adminEmail,
        from: from,
        subject: subject,
        template: 'admin-order-notification',
        context: {
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          customerPhone: params.customerPhone,
          customerId: params.customerId,
          orderNumber: params.orderNumber,
          orderDate: params.orderDate,
          totalAmount: params.totalAmount.toFixed(2),
          items: params.items,
          shippingAddress: params.shippingAddress,
          shippingCity: params.shippingCity,
          shippingState: params.shippingState,
          shippingZipCode: params.shippingZipCode,
          shippingMethod: params.shippingMethod,
          shippingDays: params.shippingDays,
          adminDashboardUrl: params.adminDashboardUrl,
        },
      });
    } catch (error) {
      console.log('Error sending admin order notification:', error);
    }
  }
}

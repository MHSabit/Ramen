import { Module } from '@nestjs/common';
import { FaqModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { WebsiteInfoModule } from './website-info/website-info.module';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';
import { ProductsModule } from './products/products.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrderItemsModule } from './order-items/order-items.module';

@Module({
  imports: [
    FaqModule,
    ContactModule,
    WebsiteInfoModule,
    PaymentTransactionModule,
    UserModule,
    NotificationModule,
    ProductsModule,
    ProductCategoryModule,
    DashboardModule,
    OrderItemsModule,
  ],
  controllers: [],
})
export class AdminModule {}

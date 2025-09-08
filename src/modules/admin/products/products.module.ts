import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { FileUploadService } from './services/file-upload.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, FileUploadService]
})
export class ProductsModule {}

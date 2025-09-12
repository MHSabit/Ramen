import { PartialType } from '@nestjs/swagger';
import { CreateProductPageDto } from './create-product-page.dto';

export class UpdateProductPageDto extends PartialType(CreateProductPageDto) {}

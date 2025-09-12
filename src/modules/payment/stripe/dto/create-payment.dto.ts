import { IsNumber, IsString, IsOptional, IsPositive, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductItemDto } from './product-item.dto';

export class CreatePaymentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductItemDto)
  products: ProductItemDto[];

  @IsString()
  @IsOptional()
  currency?: string = 'usd';

  @IsString()
  @IsOptional()
  description?: string;

  // Keep these for backward compatibility, but they'll be calculated from products
  @IsNumber()
  @IsPositive()
  @IsOptional()
  total_amount?: number; // Will be calculated from products if not provided
}

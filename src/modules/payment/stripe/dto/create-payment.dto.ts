import { IsNumber, IsString, IsOptional, IsPositive, IsArray, ValidateNested, IsEmail, IsIn, Min } from 'class-validator';
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

  // Contact Information
  @IsString()
  contact_first_name: string;

  @IsString()
  contact_last_name: string;

  @IsEmail()
  contact_email: string;

  @IsString()
  contact_phone: string;

  // Shipping Address
  @IsString()
  shipping_address: string;

  @IsString()
  shipping_city: string;

  @IsString()
  shipping_state: string;

  @IsString()
  shipping_zip_code: string;

  // Shipping Method
  @IsString()
  @IsIn(['standard', 'express', 'overnight'])
  shipping_method: 'standard' | 'express' | 'overnight';

  @IsNumber()
  @Min(0)
  shipping_cost: number;

  @IsString()
  shipping_days?: string;

  // Keep these for backward compatibility, but they'll be calculated from products
  @IsNumber()
  @IsPositive()
  @IsOptional()
  total_amount?: number; // Will be calculated from products + shipping if not provided
}

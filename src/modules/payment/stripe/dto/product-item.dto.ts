import { IsString, IsNumber, IsPositive, IsOptional, Matches } from 'class-validator';

export class ProductItemDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number = 1;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  product_id?: string; // Reference to your Product model (optional)
}

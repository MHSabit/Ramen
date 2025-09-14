import {
    IsBoolean, IsNotEmpty, IsOptional, IsString,
    IsNumber, IsInt, Min, Max
  } from 'class-validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { Transform, Type } from 'class-transformer';
  
  export class CreateProductDto {
    @ApiProperty({ description: 'Product name', example: 'Tonkotsu Ramen' })
    @IsNotEmpty()
    @IsString() 
    name: string;

    @ApiProperty({ description: 'Product category ID', example: 'category-uuid-here' })
    @IsNotEmpty()
    @IsString()
    categoryId: string;

    @ApiProperty({ description: 'Product description', example: 'Rich pork bone broth ramen', required: false })
    @IsOptional()
    @IsString()
    description?: string;
  
    @ApiProperty({ description: 'Product price', example: '12.99' })
    @Type(() => Number)
    @IsNumber()
    price: number;
  
    @ApiPropertyOptional({ description: 'Product image file', type: 'string', format: 'binary' })
    @IsOptional()
    image?: Express.Multer.File;
  
    @ApiPropertyOptional({ description: 'Product quantity', example: '50' })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(0)
    quantity?: number;
  
    @ApiProperty({ description: 'Spice level (1–5)', example: '3', enum: [1,2,3,4,5] })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    spice_level: number;
  
    @ApiPropertyOptional({
      description: 'Product features',
      example: 'Gluten-free, Vegan options, Extra noodles'
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    features?: string;
  
    @ApiPropertyOptional({ description: 'Whether product is popular', example: false })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    popular?: boolean = false;
  }
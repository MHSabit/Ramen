import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsNumber, IsDecimal } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
    @IsNotEmpty()
    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    price: number;

    @ApiProperty({ description: 'Product image file', type: 'string', format: 'binary', required: false })
    @IsOptional()
    image?: Express.Multer.File;

    @ApiProperty({ description: 'Product quantity', example: '50', required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    quantity?: number;

    @ApiProperty({ description: 'Spice level', example: 'Medium', required: false })
    @IsOptional()
    @IsString()
    spice_level?: string;

    @ApiProperty({ description: 'Product features', example: 'Gluten-free, Vegan options available', required: false })
    @IsOptional()
    @IsString()
    features?: string;

    @ApiProperty({ description: 'Whether product is popular', example: false, required: false })
    @IsOptional()
    @IsBoolean()
    popular?: boolean = false;

}

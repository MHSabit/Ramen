import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateProductDto extends PartialType(CreateProductDto) {
    
    @ApiProperty({ description: 'Product name', example: 'Tonkotsu Ramen', required: false })
    @IsOptional()
    @IsString() 
    name?: string;

    @ApiProperty({ description: 'Product category', example: 'Ramen', required: false })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({ description: 'Product description', example: 'Rich pork bone broth ramen', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Product price', example: '12.99', required: false })
    @IsOptional()
    @Transform(({ value }) => value ? parseFloat(value) : undefined)
    @IsNumber()
    price?: number;

    @ApiProperty({ description: 'Product image file', type: 'string', format: 'binary', required: false })
    @IsOptional()
    image?: Express.Multer.File;

    @ApiProperty({ description: 'Product quantity', example: '50', required: false })
    @IsOptional()
    @Transform(({ value }) => value ? parseInt(value) : undefined)
    @IsNumber()
    quantity?: number;

    @ApiProperty({ description: 'Spice level', example: 'Medium', required: false })
    @IsOptional()
    @IsNumber()
    spice_level?: number;

    @ApiProperty({ description: 'Product features', example: 'Gluten-free, Vegan options available', required: false })
    @IsOptional()
    @IsString()
    features?: string;

    @ApiProperty({ description: 'Whether product is popular', example: false, required: false })
    @IsOptional()
    @IsBoolean()
    popular?: boolean;
}

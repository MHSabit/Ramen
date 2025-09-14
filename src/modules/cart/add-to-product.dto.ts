import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class addToProductDto {
    @ApiProperty({ description: 'Product ID', example: 'product-uuid-here' })
    @IsNotEmpty()
    @IsString()
    product_id: string;

    @ApiProperty({ description: 'Product quantity', example: 2 })
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    product_quantity: number;
}

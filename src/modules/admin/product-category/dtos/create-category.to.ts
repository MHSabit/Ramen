import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({ description: 'Category name', example: 'Ramen' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Category description', example: 'Traditional Japanese ramen dishes', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Category image file', type: 'string', format: 'binary', required: false })
    @IsOptional()
    image?: Express.Multer.File;
}
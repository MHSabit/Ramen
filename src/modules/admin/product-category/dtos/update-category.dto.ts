import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.to';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @ApiProperty({ description: 'Category name', example: 'Ramen', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ description: 'Category description', example: 'Traditional Japanese ramen dishes', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Category icon', example: 'Fish', required: true })
    @IsString()
    icon: string;

    @ApiProperty({ description: 'Category color', example: 'Indigo to Violet', required: true })
    @IsString()
    color: string;

    @ApiProperty({ description: 'Category image file', type: 'string', format: 'binary', required: false })
    @IsOptional()
    image?: Express.Multer.File;
}

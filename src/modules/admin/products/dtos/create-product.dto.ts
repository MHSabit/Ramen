import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {

    @IsNotEmpty()
    @IsString() 
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    price: string;

    @IsNotEmpty()
    @IsString()
    quantity: string;

    @IsNotEmpty()
    @IsString()
    category: string;

    @IsOptional()
    @IsString()
    image?: string;

}

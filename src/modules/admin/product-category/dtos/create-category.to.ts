import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';


export class CreateCategoryDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    image: string;
}
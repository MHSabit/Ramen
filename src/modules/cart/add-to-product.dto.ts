import { IsNotEmpty, IsNumber, IsString } from 'class-validator';


export class addToProductDto {

    @IsString()
    @IsNotEmpty()    
    product_id: string;

    @IsNumber()
    @IsNotEmpty()
    product_quantity: number;
}
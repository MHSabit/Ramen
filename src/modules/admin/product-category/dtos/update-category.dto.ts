import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.to';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

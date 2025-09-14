import { PartialType } from '@nestjs/swagger';
import { CreateCategoryListDto } from './create-category-list.dto';

export class UpdateCategoryListDto extends PartialType(CreateCategoryListDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateProductSubCategoryDto } from './create-product-subcategory.dto';

export class UpdateProductSubCategoryDto extends PartialType(CreateProductSubCategoryDto) {}

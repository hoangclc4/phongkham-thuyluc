import { IsIn, IsInt, IsString, Min, MaxLength } from 'class-validator';
import { LINE_ITEM_CATEGORIES } from '../constants/invoice.constants';

export class LineItemDto {
  @IsString()
  @MaxLength(200)
  description!: string;

  @IsIn(LINE_ITEM_CATEGORIES)
  category!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsInt()
  @Min(0)
  unitPrice!: number;
}

import { IsString } from 'class-validator';
import { LocalizedText } from '@common/schemas/mongoose/common/localized-text';

export class CountryName extends LocalizedText {
  @IsString()
  abbr: string;
}

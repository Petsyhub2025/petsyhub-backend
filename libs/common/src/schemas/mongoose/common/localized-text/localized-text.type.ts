import { IsNotEmpty, IsString } from 'class-validator';

export class LocalizedText {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  ar: string;
}

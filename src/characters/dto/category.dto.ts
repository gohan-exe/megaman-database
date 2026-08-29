import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CategoryDto {
  @ApiProperty({ example: 'cat_megaman7' })
  id: string;

  @ApiProperty({ example: 'Mega Man 7', description: 'Nome da primeira aparição/jogo' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
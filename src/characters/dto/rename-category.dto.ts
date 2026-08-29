import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RenameCategoryDto {
  @ApiProperty({ example: 'Megga Man 7', description: 'Nome atual (com erro)' })
  @IsString()
  @IsNotEmpty()
  oldName: string;

  @ApiProperty({ example: 'Mega Man 7', description: 'Novo nome correto' })
  @IsString()
  @IsNotEmpty()
  newName: string;
}
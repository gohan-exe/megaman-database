import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CharacterDto {
  @ApiPropertyOptional({ example: 'abc123id' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Bass' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Mega Man 7' })
  @IsNotEmpty()
  @IsString()
  firstApperance: string;

  @ApiPropertyOptional({ example: 'SWN-001' })
  @IsOptional()
  @IsString()
  serial: string | null;

  @ApiProperty({ example: 'Criado por Dr. Wily para ser o rival definitivo de Mega Man.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'Orgulhoso e determinado' })
  @IsNotEmpty()
  @IsString()
  goodPoint: string;

  @ApiProperty({ example: 'Arrogante e anti-social' })
  @IsNotEmpty()
  @IsString()
  badPoint: string;

  @ApiProperty({ example: 'Superar o Mega Man' })
  @IsNotEmpty()
  @IsString()
  like: string;

  @ApiProperty({ example: 'Fracos e interferências' })
  @IsNotEmpty()
  @IsString()
  dislike: string;

  @ApiPropertyOptional({ example: 'https://storage.googleapis.com/.../bass.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({ 
    example: false, 
    description: 'Defina como true para remover a imagem atual do Storage' 
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  removeImage?: boolean;
}
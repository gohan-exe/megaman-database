import { 
  Controller, Get, Post, Patch, Delete, Body, Param, UseInterceptors, UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CharactersService } from './characters.service.js';
import { CharacterDto } from './dto/character.dto.js';
import { UpdateCharacterDto } from './dto/update-character.dto.js';
import { RenameCategoryDto } from './dto/rename-category.dto.js';
import type {} from 'multer';

@ApiTags('characters')
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um personagem dentro da subcoleção da Categoria' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Imagem do personagem' },
        name: { type: 'string', example: 'Bass' },
        firstApperance: { type: 'string', example: 'Mega Man 7' },
        serial: { type: 'string', example: 'SWN-001', nullable: true },
        description: { type: 'string', example: 'Criado por Dr. Wily para ser o rival de Mega Man.' },
        goodPoint: { type: 'string', example: 'Orgulhoso' },
        badPoint: { type: 'string', example: 'Arrogante' },
        like: { type: 'string', example: 'Superar Mega Man' },
        dislike: { type: 'string', example: 'Fracos' },
      },
      required: ['name', 'firstApperance', 'description', 'goodPoint', 'badPoint', 'like', 'dislike'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() characterDto: CharacterDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.charactersService.create(characterDto, file);
  }

  @Patch('category/rename')
  @ApiOperation({ summary: 'Renomeia o nome de um jogo/categoria e atualiza todos os personagens vinculados' })
  async renameCategory(@Body() renameCategoryDto: RenameCategoryDto) {
    return this.charactersService.renameCategory(renameCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza apenas os dados de um personagem específico' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Nova imagem do personagem (Opcional)' },
        name: { type: 'string', example: 'Bass' },
        firstApperance: { type: 'string', example: 'Mega Man 7' },
        serial: { type: 'string', example: 'SWN-001' },
        description: { type: 'string', example: 'Descrição atualizada.' },
        goodPoint: { type: 'string', example: 'Orgulhoso' },
        badPoint: { type: 'string', example: 'Arrogante' },
        like: { type: 'string', example: 'Superar Mega Man' },
        dislike: { type: 'string', example: 'Fracos' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.charactersService.update(id, updateCharacterDto, file);
  }

  @Delete('category/:categoryName')
  @ApiOperation({ 
    summary: 'Deleta uma categoria em cascata (remove a categoria e todos os personagens vinculados a ela)' 
  })
  async removeCategory(@Param('categoryName') categoryName: string) {
    return this.charactersService.removeCategory(categoryName);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Deleta um personagem específico e limpa a categoria caso ela fique vazia' 
  })
  async remove(@Param('id') id: string) {
    return this.charactersService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os personagens de todas as categorias' })
  async findAll() {
    return this.charactersService.findAll();
  }

  @Get('category/:categoryName')
  @ApiOperation({ summary: 'Lista os personagens pertencentes a uma categoria específica' })
  async findByCategory(@Param('categoryName') categoryName: string) {
    return this.charactersService.findByCategory(categoryName);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um personagem específico por ID' })
  async findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }

  
}
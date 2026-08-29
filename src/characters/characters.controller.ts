import { 
  Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CharactersService } from './characters.service.js';
import { CharacterDto } from './dto/character.dto.js';
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

  @Get()
  @ApiOperation({ summary: 'Lista todos os personagens de todas as categorias' })
  async findAll() {
    return this.charactersService.findAll();
  }

  @Get('category/:categoryName')
  @ApiOperation({ summary: 'Lista os personagens pertencentes a uma categoria específica (Ex: Mega Man 7)' })
  async findByCategory(@Param('categoryName') categoryName: string) {
    return this.charactersService.findByCategory(categoryName);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um personagem específico por ID' })
  async findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }
}
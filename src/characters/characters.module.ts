import { Module } from '@nestjs/common';
import { CharactersService } from './characters.service.js';
import { CharactersController } from './characters.controller.js';

@Module({
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {}

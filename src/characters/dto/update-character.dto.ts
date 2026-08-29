import { PartialType } from '@nestjs/swagger';
import { CharacterDto } from './character.dto.js';

export class UpdateCharacterDto extends PartialType(CharacterDto) {}
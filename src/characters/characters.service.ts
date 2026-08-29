import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service.js';
import { CharacterDto } from './dto/character.dto.js';
import type {} from 'multer';

@Injectable()
export class CharactersService {
  private categoriesCollection = 'games';

  constructor(private readonly firebaseService: FirebaseService) {}

  // Gera um ID amigável (slug) para categorias ou personagens
  // Exemplo: "Mega Man 7" -> "mega-man-7", "Bass" -> "bass"
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD') // Remove acentos
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Upload da imagem no Cloud Storage
  async uploadImage(file: Express.Multer.File): Promise<string> {
    const bucket = this.firebaseService.getStorage().bucket();
    const fileName = `characters/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    await fileUpload.makePublic();
    return fileUpload.publicUrl();
  }

  // Criar Categoria (Pai) e Personagem (Filho) usando o Nome do Personagem como ID
  async create(
    characterDto: CharacterDto,
    imageFile?: Express.Multer.File,
  ): Promise<CharacterDto> {
    const db = this.firebaseService.getFirestore();

    // 1. Upload da imagem se enviada
    if (imageFile) {
      characterDto.imageUrl = await this.uploadImage(imageFile);
    }

    // 2. Identifica/Gera a Categoria Pai (Ex: "mega-man-7")
    const categoryId = this.generateSlug(characterDto.firstApperance);
    const categoryRef = db.collection(this.categoriesCollection).doc(categoryId);

    // Cria/Atualiza a categoria sem sobrescrever dados existentes
    await categoryRef.set(
      {
        name: characterDto.firstApperance,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    // 3. Prepara os dados do personagem removendo o 'id' para evitar undefined
    const { id, ...dataToSave } = characterDto;

    // 4. Gera o ID amigável usando o Nome do Personagem (Ex: "bass")
    const characterId = this.generateSlug(characterDto.name);
    const characterRef = categoryRef.collection('characters').doc(characterId);

    await characterRef.set({
      ...dataToSave,
      serial: characterDto.serial ?? null,
      imageUrl: characterDto.imageUrl ?? null,
      createdAt: new Date().toISOString(),
    });

    return { id: characterId, ...characterDto };
  }

  // Listar todos os personagens de todas as categorias
  async findAll(): Promise<CharacterDto[]> {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db.collectionGroup('characters').get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CharacterDto, 'id'>),
    }));
  }

  // Listar personagens de uma categoria específica
  async findByCategory(categoryName: string): Promise<CharacterDto[]> {
    const db = this.firebaseService.getFirestore();
    const categoryId = this.generateSlug(categoryName);

    const snapshot = await db
      .collection(this.categoriesCollection)
      .doc(categoryId)
      .collection('characters')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CharacterDto, 'id'>),
    }));
  }

  // Buscar personagem por ID (Slug do Nome, ex: "bass")
  async findOne(id: string): Promise<CharacterDto> {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db.collectionGroup('characters').get();

    const doc = snapshot.docs.find((d) => d.id === id);

    if (!doc) {
      throw new NotFoundException(`Personagem com ID '${id}' não foi encontrado.`);
    }

    return { id: doc.id, ...(doc.data() as Omit<CharacterDto, 'id'>) };
  }
}
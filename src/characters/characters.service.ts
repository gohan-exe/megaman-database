import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service.js';
import { CharacterDto } from './dto/character.dto.js';
import { UpdateCharacterDto } from './dto/update-character.dto.js';
import { RenameCategoryDto } from './dto/rename-category.dto.js';
import type {} from 'multer';

@Injectable()
export class CharactersService {
  private categoriesCollection = 'categories';

  constructor(private readonly firebaseService: FirebaseService) {}

  // Gera um ID amigável (slug) para categorias ou personagens
  // Exemplo: "Mega Man 7" -> "mega-man-7", "Bass" -> "bass"
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
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

  // Deleta o arquivo do Cloud Storage a partir da sua URL pública
  private async deleteImageByUrl(publicUrl: string): Promise<void> {
    try {
      if (!publicUrl) return;

      // Trata URLs que contêm query params (ex: ?alt=media&token=...)
      const cleanUrl = publicUrl.split('?')[0];

      // Decodifica a URL (%2F vira /) e extrai tudo após o diretório 'characters/'
      const decodedUrl = decodeURIComponent(cleanUrl);
      const match = decodedUrl.match(/characters\/(.+)$/);

      if (match && match[1]) {
        const filePath = `characters/${match[1]}`;
        const bucket = this.firebaseService.getStorage().bucket();
        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Imagem removida com sucesso do Storage: ${filePath}`);
        } else {
          console.warn(`Imagem não encontrada no Storage: ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`Erro ao deletar imagem do Storage: ${(error as Error).message}`);
    }
  }

  // 1. Criar Categoria e Personagem na Subcoleção
  async create(
    characterDto: CharacterDto,
    imageFile?: Express.Multer.File,
  ): Promise<CharacterDto> {
    const db = this.firebaseService.getFirestore();

    if (imageFile) {
      characterDto.imageUrl = await this.uploadImage(imageFile);
    }

    const categoryId = this.generateSlug(characterDto.firstApperance);
    const categoryRef = db.collection(this.categoriesCollection).doc(categoryId);

    await categoryRef.set(
      {
        name: characterDto.firstApperance,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    // Separamos 'id' e 'removeImage' para que NUNCA vão como 'undefined' para o Firestore
    const { id, removeImage, ...dataToSave } = characterDto;
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

  // 2. Edição SIMPLES do Personagem com suporte a remoção/troca de imagem
  async update(
    id: string,
    updateCharacterDto: UpdateCharacterDto,
    imageFile?: Express.Multer.File,
  ): Promise<CharacterDto> {
    const db = this.firebaseService.getFirestore();

    const snapshot = await db.collectionGroup('characters').get();
    const doc = snapshot.docs.find((d) => d.id === id);

    if (!doc) {
      throw new NotFoundException(`Personagem com ID '${id}' não foi encontrado.`);
    }

    const currentData = doc.data() as CharacterDto;
    const { id: _, removeImage, ...updatedFields } = updateCharacterDto;

    const isRemoveImageRequested = String(removeImage) === 'true';
    let newImageUrl: string | null = currentData.imageUrl ?? null;

    // Cenário A: Usuário pediu para REMOVER a imagem
    if (isRemoveImageRequested) {
      if (currentData.imageUrl) {
        await this.deleteImageByUrl(currentData.imageUrl);
      }
      newImageUrl = null;
    } 
    // Cenário B: Usuário enviou uma NOVA imagem (substituição)
    else if (imageFile) {
      if (currentData.imageUrl) {
        await this.deleteImageByUrl(currentData.imageUrl);
      }
      newImageUrl = await this.uploadImage(imageFile);
    }

    // Remove propriedades 'undefined' para manter intactos os campos não enviados
    const cleanUpdatedFields = Object.fromEntries(
      Object.entries(updatedFields).filter(([_, value]) => value !== undefined),
    );

    await doc.ref.update({
      ...cleanUpdatedFields,
      imageUrl: newImageUrl,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await doc.ref.get();
    return { id: doc.id, ...(updatedDoc.data() as Omit<CharacterDto, 'id'>) };
  }

  // 3. Edição em CASCATA exclusiva para renomear Jogos/Categorias
  async renameCategory(
    renameCategoryDto: RenameCategoryDto,
  ): Promise<{ message: string; totalUpdated: number }> {
    const db = this.firebaseService.getFirestore();
    const { oldName, newName } = renameCategoryDto;

    const oldCategorySlug = this.generateSlug(oldName);
    const newCategorySlug = this.generateSlug(newName);

    const oldCategoryRef = db.collection(this.categoriesCollection).doc(oldCategorySlug);
    const oldCategoryDoc = await oldCategoryRef.get();

    if (!oldCategoryDoc.exists) {
      throw new NotFoundException(`A categoria '${oldName}' não foi encontrada.`);
    }

    // Cria/Garante a nova categoria
    const newCategoryRef = db.collection(this.categoriesCollection).doc(newCategorySlug);
    await newCategoryRef.set(
      {
        name: newName,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    // Busca todos os personagens da subcoleção antiga
    const charactersSnapshot = await oldCategoryRef.collection('characters').get();
    const batch = db.batch();

    charactersSnapshot.docs.forEach((charDoc) => {
      const charData = charDoc.data();
      const newCharRef = newCategoryRef.collection('characters').doc(charDoc.id);

      // Copia para a nova subcoleção atualizando a firstApperance
      batch.set(newCharRef, {
        ...charData,
        firstApperance: newName,
        updatedAt: new Date().toISOString(),
      });

      // Remove da subcoleção antiga
      batch.delete(charDoc.ref);
    });

    await batch.commit();

    // Apaga o documento pai antigo que ficou vazio
    await oldCategoryRef.delete();

    return {
      message: `Categoria '${oldName}' renomeada com sucesso para '${newName}'.`,
      totalUpdated: charactersSnapshot.size,
    };
  }

  // 1. Deleção Individual de Personagem (+ Limpeza de Categoria Vazia)
  async remove(id: string): Promise<{ message: string }> {
    const db = this.firebaseService.getFirestore();

    // Busca o personagem na subcoleção
    const snapshot = await db.collectionGroup('characters').get();
    const doc = snapshot.docs.find((d) => d.id === id);

    if (!doc) {
      throw new NotFoundException(`Personagem com ID '${id}' não foi encontrado.`);
    }

    const characterData = doc.data() as CharacterDto;
    const parentCategoryRef = doc.ref.parent.parent; // Referência ao documento da Categoria pai

    // Remove a imagem do Storage se existir
    if (characterData.imageUrl) {
      await this.deleteImageByUrl(characterData.imageUrl);
    }

    // Deleta o personagem da subcoleção
    await doc.ref.delete();

    // Se o documento pai existir, verifica se a categoria ficou sem personagens
    if (parentCategoryRef) {
      const remainingDocs = await parentCategoryRef.collection('characters').get();
      if (remainingDocs.empty) {
        await parentCategoryRef.delete();
      }
    }

    return { message: `Personagem '${characterData.name}' removido com sucesso.` };
  }

  // 2. Deleção em Cascata de toda uma Categoria/Jogo
  async removeCategory(categoryName: string): Promise<{ message: string; totalDeleted: number }> {
    const db = this.firebaseService.getFirestore();
    const categoryId = this.generateSlug(categoryName);
    const categoryRef = db.collection(this.categoriesCollection).doc(categoryId);

    const categoryDoc = await categoryRef.get();
    if (!categoryDoc.exists) {
      throw new NotFoundException(`A categoria '${categoryName}' não foi encontrada.`);
    }

    // Busca todos os personagens da subcoleção
    const charactersSnapshot = await categoryRef.collection('characters').get();
    const batch = db.batch();

    // Exclui as imagens do Storage e limpa os documentos na batch
    for (const charDoc of charactersSnapshot.docs) {
      const charData = charDoc.data() as CharacterDto;
      if (charData.imageUrl) {
        await this.deleteImageByUrl(charData.imageUrl);
      }
      batch.delete(charDoc.ref);
    }

    await batch.commit();

    // Apaga o documento pai da categoria
    await categoryRef.delete();

    return {
      message: `Categoria '${categoryName}' e todos os seus ${charactersSnapshot.size} personagens foram removidos com sucesso.`,
      totalDeleted: charactersSnapshot.size,
    };
  }

  // Listar todos os personagens
  async findAll(): Promise<CharacterDto[]> {
    const db = this.firebaseService.getFirestore();
    const snapshot = await db.collectionGroup('characters').get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CharacterDto, 'id'>),
    }));
  }

  // Listar personagens por categoria
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

  // Buscar por ID
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
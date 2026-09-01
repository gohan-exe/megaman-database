import { Injectable, OnModuleInit } from '@nestjs/common';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Storage, getStorage } from 'firebase-admin/storage';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: Firestore;
  private storage: Storage;

  onModuleInit() {
    if (!getApps().length) {
      // Converte as quebras de linha enviadas na string da chave privada
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }

    this.db = getFirestore();
    this.storage = getStorage();
  }

  getFirestore(): Firestore {
    return this.db;
  }

  getStorage(): Storage {
    return this.storage;
  }
}
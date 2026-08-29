import { Injectable, OnModuleInit } from '@nestjs/common';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Storage, getStorage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: Firestore;
  private storage: Storage;

  onModuleInit() {
    // Busca o arquivo JSON na raiz do projeto (junto ao package.json)
    const serviceAccountPath = path.resolve(
      process.cwd(),
      'megamandatabase-f7d8d-firebase-adminsdk-fbsvc-3639d96bb6.json',
    );

    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, 'utf8'),
    );

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.STORAGE_BUCKET,
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
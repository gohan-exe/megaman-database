import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module.js';
import { CharactersModule } from './characters/characters.module.js';

@Module({
  imports: [FirebaseModule, CharactersModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

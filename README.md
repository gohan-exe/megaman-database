# 🤖 Rockman & Forte Database (Mega Man Database API)

API RESTful desenvolvida em **NestJS** para gerenciamento do catálogo de personagens e jogos da franquia **Mega Man / Rockman & Forte**. A aplicação integra o **Firebase Firestore** para armazenamento dos dados estruturados em subcoleções por categorias (jogos) e o **Firebase Cloud Storage** para o gerenciamento de upload de imagens.

---

## 🚀 Tecnologias Utilizadas

- **Node.js** & **TypeScript**
- **NestJS** - Framework backend progressivo
- **Firebase Admin SDK**:
  - **Firestore**: Banco de dados NoSQL estruturado em Coleções e Subcoleções
  - **Cloud Storage**: Armazenamento e hospedagem de imagens
- **Multer**: Processamento de uploads de imagens
- **Swagger / OpenAPI**: Documentação interativa da API

---

## 📌 Funcionalidades

### 👤 Personagens (`/characters`)
- **Criar Personagem (`POST /characters`)**: Cadastra um novo personagem com upload opcional de imagem. Cria automaticamente a categoria/jogo correspondente no Firestore se ela não existir.
- **Listar Todos (`GET /characters`)**: Retorna a lista completa de todos os personagens cadastrados nas subcoleções.
- **Buscar por ID (`GET /characters/:id`)**: Retorna os detalhes de um personagem específico.
- **Listar por Categoria (`GET /characters/category/:categoryName`)**: Retorna os personagens pertencentes a uma jogo/categoria.
- **Atualizar Personagem (`PATCH /characters/:id`)**: Atualiza dados parciais do personagem, permitindo substituição de imagem ou remoção (`removeImage: true`).
- **Deletar Personagem (`DELETE /characters/:id`)**: Remove o personagem da subcoleção e apaga sua imagem correspondente no Cloud Storage. Apaga a categoria pai se ela ficar sem personagens.

### 📁 Categorias / Jogos (`/characters/category`)
- **Renomear Categoria (`PATCH /characters/category/rename`)**: Atualização em cascata. Migra todos os personagens da subcoleção antiga para uma nova categoria e atualiza o campo `firstApperance`.
- **Deletar Categoria (`DELETE /characters/category/:categoryName`)**: Deleção em cascata. Remove todos os personagens da subcoleção, suas respectivas imagens no Cloud Storage e o documento pai da categoria.

---

## 📋 Pré-requisitos

- **Node.js** (v18 ou superior)
- **npm** ou **yarn**
- Conta no **Firebase** com projeto configurado (Firestore + Cloud Storage)

---

## ⚙️ Configuração do Ambiente

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/megaman-database.git](https://github.com/seu-usuario/megaman-database.git)
   cd megaman-database
2. **Instale as dependências:**
    ```bash
    npm install
3. **Configure as Variáveis de Ambiente:**
Crie um arquivo .env na raiz do projeto com as credenciais da sua conta de serviço do Firebase:
    ```bash
    FIREBASE_PROJECT_ID=seu-project-id

    FIREBASE_CLIENT_EMAIL=seu-client-email@seu-project-id.iam.gserviceaccount.com

    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSuaChavePrivadaAqui\n-----END PRIVATE KEY-----\n"

    FIREBASE_STORAGE_BUCKET=seu-project-id.appspot.com

## 🏃 Execution da Aplicação
    
    

    # Modo de desenvolvimento com auto-reload
    $ npm run start:dev

    # Modo de produção
    $ npm run build
    $ npm run start:prod

A API estará disponível por padrão em http://localhost:3000.

## 📖 Documentação da API (Swagger)
Com a aplicação rodando, acesse a documentação interativa para testar as rotas diretamente no navegador:

👉 http://localhost:3000/api

## 🛠️ Estrutura do Projeto
    src/
    ├── characters/
    │   ├── dto/
    │   │   ├── character.dto.ts
    │   │   ├── update-character.dto.ts
    │   │   └── rename-category.dto.ts
    │   ├── characters.controller.ts
    │   ├── characters.service.ts
    │   └── characters.module.ts
    ├── firebase/
    │   ├── firebase.service.ts
    │   └── firebase.module.ts
    ├── app.module.ts
    └── main.ts

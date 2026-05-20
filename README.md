# CineList 🎬

CineList é um aplicativo de filmes premium, moderno e sofisticado para catalogar, avaliar e favoritar filmes. O aplicativo é composto por um **backend em Node.js (seguindo o padrão MVC)** e um **frontend SPA em ReactJS**, ambos conectados de forma segura ao **Supabase**.

---

## 🛠️ Tecnologias Utilizadas

* **Frontend**: ReactJS, Vite, Lucide React (Ícones), Vanilla CSS (Design Tokens, Glassmorphism, Dark Mode).
* **Backend**: Node.js, Express, Supabase JS Client, Dotenv, CORS.
* **Banco de Dados**: Supabase (PostgreSQL com Row Level Security - RLS).
* **MCP / CLI**: Supabase CLI para gerenciamento.

---

## 📁 Estrutura do Projeto (Padrão MVC)

```text
CineList/
├── backend/
│   ├── src/
│   │   ├── config/       # Conexão e configuração do Supabase
│   │   ├── controllers/  # Controladores de lógica de negócio (C de MVC)
│   │   ├── middlewares/  # Middleware de autenticação por JWT do Supabase
│   │   ├── models/       # Modelos e abstrações de banco de dados (M de MVC)
│   │   └── routes/       # Mapeamento de endpoints da API REST
│   ├── server.js         # Servidor Express (Ponto de Entrada)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Elementos reutilizáveis (Estrelas, Cards, Toasts) (V de MVC)
│   │   ├── pages/        # Telas (Dashboard, Biblioteca, Login/Cadastro) (V de MVC)
│   │   ├── services/     # Clientes de integração (API Node.js & Auth Supabase)
│   │   ├── index.css     # Estilização global avançada (CSS customizado)
│   │   └── main.jsx
│   ├── index.html        # Estrutura HTML com SEO otimizado
│   └── package.json
├── schema.sql            # Script SQL de tabelas e políticas de segurança
└── README.md             # Instruções de uso (Este arquivo!)
```

---

## 🚀 Como Executar o Projeto Passo a Passo

Como solicitado, **não é utilizado nenhum tipo de Docker**. O projeto roda inteiramente de forma nativa e local.

### Passo 1: Configurar o Banco de Dados no Supabase

1. Vá para [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Crie um **Novo Projeto** (New Project). Defina um nome (ex: `CineList`), senha do banco de dados e selecione a região mais próxima.
3. Assim que o projeto for provisionado, acesse o menu **SQL Editor** no painel lateral esquerdo.
4. Clique em **New Query** (Nova Consulta).
5. Abra o arquivo [schema.sql](./schema.sql) localizado no diretório raiz deste projeto, copie todo o seu conteúdo e cole no editor do Supabase.
6. Clique no botão **Run** (Executar) no canto inferior direito.
   * *Isso criará as tabelas `movies`, `reviews` e `favorites`, habilitará as políticas de segurança de linha (RLS) e alimentará a base com 5 filmes populares de exemplo.*

---

### Passo 2: Obter as Credenciais do Supabase

No painel do Supabase:
1. Vá em **Project Settings** (Engrenagem no canto inferior esquerdo) > **API**.
2. Copie os seguintes valores:
   * **Project URL** (ex: `https://xxxxxx.supabase.co`)
   * **anon / public** key (ex: `eyJhbGciOi...`)

---

### Passo 3: Configurar os arquivos `.env`

#### No Backend (`backend/.env`):
Crie ou edite o arquivo `backend/.env` e substitua as variáveis com as chaves obtidas no Passo 2:
```env
PORT=3001
SUPABASE_URL=https://sua-url-do-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key-aqui
```

#### No Frontend (`frontend/.env`):
Crie ou edite o arquivo `frontend/.env` e insira as variáveis necessárias:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://sua-url-do-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

---

### Passo 4: Rodar o Backend

1. Abra um terminal na pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências (já inicializadas):
   ```bash
   npm install
   ```
3. Inicie o servidor em modo de desenvolvimento (atualiza automaticamente ao salvar):
   ```bash
   npm run dev
   ```
   * O servidor iniciará em `http://localhost:3001`. Você pode testar se a rota de status está ativa acessando `http://localhost:3001/health` no seu navegador.

---

### Passo 5: Rodar o Frontend

1. Abra outro terminal na pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor do React:
   ```bash
   npm run dev
   ```
   * O Vite abrirá a aplicação em `http://localhost:5173`. Acesse no seu navegador para começar a interagir!

---

## 🎬 Funcionalidades para Testar

1. **Autenticação**: Crie uma conta na tela inicial (Sign Up) com e-mail e senha e faça o login.
2. **Catálogo de Filmes**: Na aba principal, pesquise pelos filmes semeados (ex: digite "Inception" ou "Interstellar").
3. **Favoritar**: Clique no coração flutuante no card do filme ou na página de detalhes. Ele será imediatamente adicionado à aba **Favoritos**. Você pode desfavoritar clicando novamente.
4. **Avaliação por Estrelas**: Clique em um card de filme para abrir a tela de detalhes. Selecione de 1 a 5 estrelas (passando o mouse para ver a animação de preenchimento) e digite um comentário na caixa de texto. Clique em **Publicar Avaliação**.
5. **Comunidade**: A média das avaliações do filme será recalculada imediatamente, exibindo a nova nota e listando o seu comentário e o de outros usuários na lateral direita. Você pode excluir seu próprio comentário clicando na lixeira vermelha correspondente.

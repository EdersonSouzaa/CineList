# CineList 🎬

CineList é um aplicativo de catálogo, avaliação e curadoria de filmes premium, moderno e sofisticado. A aplicação combina uma interface **glassmorphic escura** responsiva e repleta de micro-interações a um **backend em Node.js (padrão MVC)** seguro conectado ao **Supabase**.

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
│   │   ├── pages/        # Telas (Dashboard, Biblioteca, Login/Cadastro, CineQuiz) (V de MVC)
│   │   ├── services/     # Clientes de integração (API Node.js & TMDB Service)
│   │   ├── index.css     # Estilização global avançada (CSS customizado, animações e glows)
│   │   └── main.jsx
│   ├── index.html        # Estrutura HTML com SEO otimizado
│   └── package.json
├── schema.sql            # Script SQL inicial de tabelas e políticas de segurança
├── migration_v2.sql      # Script SQL de migração para likes e curtidas
├── migration_v3.sql      # Script SQL de migração para sincronização TMDB e trailers
├── migration_v4.sql      # Script SQL de migração para suporte a filtros de spoiler
└── README.md             # Instruções de uso (Este arquivo!)
```

---

## ✨ Funcionalidades Avançadas Implementadas

1. **⏱️ Filtro "Tempo Limite" (Feature 11)**:
   A Dashboard possui um controle deslizante (*slider*) avançado nas opções de filtragem que permite limitar a busca de filmes no TMDB de acordo com a sua duração em minutos (entre 15 e 240 minutos).

2. **🦎 Interface Dinâmica Camaleão (Feature 12)**:
   Ao abrir os detalhes de qualquer produção, um algoritmo em Canvas HTML5 analisa o pôster do filme em tempo real, extrai a cor média predominante e a injeta como variáveis dinâmicas CSS (`--chameleon-color` e `--chameleon-color-accent`). O fundo do aplicativo e os botões da modal ganham uma aura brilhante ambientada que muda de acordo com o filme selecionado!

3. **🛡️ Filtro Inteligente Anti-Spoiler (Feature 14)**:
   Ao escrever uma crítica, os usuários podem marcar a opção *"Este comentário contém spoilers?"*. Na listagem de avaliações do filme, os comentários marcados como spoilers são ocultados sob um card embaçado com aviso. Basta clicar para revelar ou ocultar a crítica novamente.

4. **💡 Modo Cinema (Feature 15)**:
   Na modal de detalhes do filme, há um interruptor com ícone de lâmpada no topo direito. Ao ser clicado, a tela escurece quase 100%, esmaecendo descrições e comentários adicionais e destacando inteiramente a área do trailer com borda brilhante e sombras neon.

5. **🍿 CineQuiz (Feature 16)**:
   Um jogo dinâmico de trivia integrado no menu principal que busca filmes populares do TMDB para gerar 5 perguntas aleatórias e personalizadas por partida. Conta com animações dinâmicas de erro (balanço/shake vermelho) e acerto (pulso de luz verde), placar acumulado e medalhas de conquista personalizadas.

6. **📍 CineMap (Feature 20)**:
   Seção visual integrada à modal que exibe no mapa (OpenStreetMap com tema escuro via filtros CSS) a locação real onde cenas icônicas de produções famosas foram filmadas (ex: as escadarias do Bronx de *Joker* ou a ponte Bir-Hakeim de *Inception*). Produções sem cenas mapeadas contam com *fallback* automático posicionando o mapa no país de origem da produtora do filme.

---

## 🚀 Como Executar o Projeto Passo a Passo

O projeto roda de forma nativa e local, sem necessidade de Docker.

### Passo 1: Configurar o Banco de Dados no Supabase

1. Vá para [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Crie um **Novo Projeto** (New Project). Defina um nome, senha do banco de dados e selecione a região mais próxima.
3. Assim que o projeto for provisionado, acesse o menu **SQL Editor** no painel lateral esquerdo.
4. Clique em **New Query** (Nova Consulta).
5. Abra o arquivo [schema.sql](./schema.sql) localizado no diretório raiz deste projeto, copie todo o seu conteúdo e cole no editor do Supabase. Clique no botão **Run** (Executar).
6. Repita o mesmo processo de criar uma **New Query** e rodar as migrações na ordem cronológica de atualização:
   * **[migration_v2.sql](./migration_v2.sql)** (Criação de curtidas em comentários).
   * **[migration_v3.sql](./migration_v3.sql)** (Sincronização de campos TMDB extras).
   * **[migration_v4.sql](./migration_v4.sql)** (Nova coluna `is_spoiler` na tabela `reviews`).

---

### Passo 2: Obter as Credenciais do Supabase

No painel do seu projeto Supabase:
1. Vá em **Project Settings** (Ícone de engrenagem no canto inferior esquerdo) > **API**.
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
2. Instale as dependências:
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

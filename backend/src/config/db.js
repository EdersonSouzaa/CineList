import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define o caminho para a pasta data na raiz do backend
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

// Garante que o diretório data exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inicializa o banco de dados se ele não existir
const initialSchema = {
  users: [],
  reviews: [],
  favorites: [],
  review_likes: []
};

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify(initialSchema, null, 2), 'utf-8');
}

export const db = {
  // Ler todos os dados
  read() {
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Erro ao ler banco de dados JSON:', error);
      return initialSchema;
    }
  },

  // Escrever dados completos
  write(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Erro ao escrever banco de dados JSON:', error);
      return false;
    }
  },

  // Helper para obter uma coleção específica
  getCollection(name) {
    const data = this.read();
    return data[name] || [];
  },

  // Helper para salvar uma coleção específica
  saveCollection(name, collection) {
    const data = this.read();
    data[name] = collection;
    return this.write(data);
  }
};

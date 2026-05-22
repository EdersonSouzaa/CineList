import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Connecting to:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Fetching reviews...');
  const { data, error } = await supabase.from('reviews').select('*').limit(5);
  if (error) {
    console.error('Error fetching reviews:', error);
  } else {
    console.log('Reviews fetched successfully:', data);
  }
}

run().catch(console.error);

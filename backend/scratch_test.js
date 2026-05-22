import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Connecting to:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { Review } from './src/models/Review.js';

async function run() {
  console.log('Testing Review.getByMovieId...');
  try {
    const data = await Review.getByMovieId('tv_76479', supabase);
    console.log('Successfully retrieved reviews:', data);
  } catch (error) {
    console.error('Failed to retrieve reviews:', error);
  }
}

run().catch(console.error);

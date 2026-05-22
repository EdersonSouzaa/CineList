import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';

  console.log('Signing up user:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: 'Test User'
      }
    }
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  const session = signUpData.session;
  const user = signUpData.user;
  console.log('Signed up successfully. User ID:', user?.id);

  if (!session) {
    console.log('No session returned. Probably email confirmation is required.');
    // Try to sign in just in case
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      console.error('Sign in error:', signInError);
      return;
    }
    console.log('Signed in successfully.');
  }

  const token = signUpData.session?.access_token || (await supabase.auth.getSession()).data.session?.access_token;
  if (!token) {
    console.error('Could not get access token!');
    return;
  }

  // Create user client like the backend does
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  console.log('Inserting review...');
  const { data: insertData, error: insertError } = await userClient
    .from('reviews')
    .insert([
      {
        movie_id: 'movie_test_123',
        user_id: user.id,
        user_email: email,
        rating: 4,
        comment: 'Test comment from scratch script'
      }
    ])
    .select()
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
  } else {
    console.log('Insert success:', insertData);
  }
}

run().catch(console.error);

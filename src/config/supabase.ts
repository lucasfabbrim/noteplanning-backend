import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Cliente Supabase para operações do lado do servidor
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Cliente Supabase para operações públicas
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// Função para verificar a conexão com o Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('_supabase_migrations')
      .select('version')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (normal for new projects)
      console.error('Supabase connection error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

// Função para obter informações do projeto Supabase
export async function getSupabaseProjectInfo() {
  try {
    const { data, error } = await supabaseAdmin
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

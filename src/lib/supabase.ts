import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'seu-url-do-supabase-aqui') {
  console.warn('Aviso: VITE_SUPABASE_URL não está configurada corretamente no seu arquivo .env')
}

if (!supabaseAnonKey || supabaseAnonKey === 'sua-chave-anon-do-supabase-aqui') {
  console.warn('Aviso: VITE_SUPABASE_ANON_KEY não está configurada corretamente no seu arquivo .env')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

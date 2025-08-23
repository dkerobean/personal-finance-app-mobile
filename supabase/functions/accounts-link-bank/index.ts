import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const monoSecretKey = Deno.env.get('MONO_SECRET_KEY')!

interface MonoAccountRequest {
  mono_code: string;
  mono_id: string;
}

interface MonoAccountData {
  id: string;
  account: {
    id: string;
    name: string;
    accountNumber: string;
    type: string;
    balance: number;
    currency: string;
  };
  institution: {
    name: string;
    bankCode: string;
    type: string;
  };
}

async function exchangeMonoCode(code: string): Promise<MonoAccountData> {
  const response = await fetch('https://api.withmono.com/v2/accounts/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'mono-sec-key': monoSecretKey,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Mono API Error:', error);
    throw new Error(`Mono API error: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing auth header')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication failed')
    }

    // Parse request body
    const { mono_code, mono_id }: MonoAccountRequest = await req.json()

    if (!mono_code || !mono_id) {
      throw new Error('Missing required fields: mono_code and mono_id')
    }

    // Exchange Mono code for account data
    console.log('Exchanging Mono code for account data...')
    const monoData = await exchangeMonoCode(mono_code)

    // Create account record
    const accountData = {
      user_id: user.id,
      account_name: monoData.account.name,
      account_type: 'bank',
      institution_name: monoData.institution.name,
      balance: monoData.account.balance,
      mono_account_id: monoData.id,
      last_synced_at: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert into database
    const { data: account, error: insertError } = await supabase
      .from('accounts')
      .insert(accountData)
      .select()
      .single()

    if (insertError) {
      console.error('Database insertion error:', insertError)
      throw new Error('Failed to save account data')
    }

    console.log('Successfully linked bank account:', account.id)

    return new Response(
      JSON.stringify({
        success: true,
        account,
        message: 'Bank account linked successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in accounts-link-bank:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('auth') ? 401 : 400

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: 'Failed to link bank account'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    )
  }
})
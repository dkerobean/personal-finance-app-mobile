import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

interface MTNMoMoAccountRequest {
  phone_number: string;
  account_name: string;
  balance: number;
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
    const { phone_number, account_name, balance }: MTNMoMoAccountRequest = await req.json()

    if (!phone_number || !account_name) {
      throw new Error('Missing required fields: phone_number and account_name')
    }

    // Validate phone number format (basic Ghana phone number validation)
    const phoneRegex = /^(\+233|0)[2-9]\d{8}$/
    if (!phoneRegex.test(phone_number)) {
      throw new Error('Invalid Ghana phone number format')
    }

    // Check if MTN MoMo account already exists for this user
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('account_type', 'mobile_money')
      .eq('mtn_phone_number', phone_number)
      .eq('is_active', true)
      .maybeSingle()

    if (existingAccount) {
      throw new Error('MTN MoMo account with this phone number is already linked')
    }

    // Generate MTN reference ID (in production, this would come from MTN MoMo API)
    const mtn_reference_id = `mtn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create account record
    const accountData = {
      user_id: user.id,
      account_name,
      account_type: 'mobile_money',
      institution_name: 'MTN Mobile Money',
      balance: balance || 0,
      mtn_reference_id,
      mtn_phone_number: phone_number,
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
      throw new Error('Failed to save MTN MoMo account data')
    }

    console.log('Successfully linked MTN MoMo account:', account.id)

    return new Response(
      JSON.stringify({
        success: true,
        account,
        message: 'MTN MoMo account linked successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in accounts-link-momo:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('auth') ? 401 : 
                      errorMessage.includes('already linked') ? 409 : 400

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        message: 'Failed to link MTN MoMo account'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    )
  }
})
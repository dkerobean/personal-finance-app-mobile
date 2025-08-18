import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

interface WebhookPayload {
  financialTransactionId?: string;
  externalId: string;
  amount: string;
  currency: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage?: string;
  payeeNote?: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reason?: string;
  timestamp: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-momo-signature',
}

// Function to verify webhook signature
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Create HMAC SHA256 signature
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const data = encoder.encode(payload)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data)
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    // Compare signatures (constant time comparison)
    const expectedSignature = signature.replace('sha256=', '')
    return computedSignature === expectedSignature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the raw request body for signature verification
    const rawBody = await req.text()
    
    // Verify webhook signature (MTN MoMo specific implementation)
    const signature = req.headers.get('x-momo-signature')
    const webhookSecret = Deno.env.get('MTN_MOMO_WEBHOOK_SECRET')
    
    if (webhookSecret && signature) {
      const isValidSignature = await verifyWebhookSignature(rawBody, signature, webhookSecret)
      if (!isValidSignature) {
        console.warn('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } else if (webhookSecret) {
      // Webhook secret is configured but no signature provided
      console.warn('Webhook received without signature but secret is configured')
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      console.warn('Webhook signature verification disabled (no secret configured)')
    }

    // Parse webhook payload
    const payload: WebhookPayload = JSON.parse(rawBody)
    console.log('MTN MoMo Webhook received:', {
      externalId: payload.externalId,
      status: payload.status,
      amount: payload.amount,
      timestamp: payload.timestamp
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find transaction by external ID
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('momo_external_id', payload.externalId)
      .single()

    if (findError || !transaction) {
      console.error('Transaction not found:', payload.externalId, findError)
      return new Response(
        JSON.stringify({ 
          error: 'Transaction not found',
          externalId: payload.externalId 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update transaction status based on webhook
    const updateData: any = {
      momo_status: payload.status,
      momo_financial_transaction_id: payload.financialTransactionId,
      updated_at: new Date().toISOString()
    }

    // If transaction failed, add reason
    if (payload.status === 'FAILED' && payload.reason) {
      updateData.description = `${transaction.description || ''} (Failed: ${payload.reason})`.trim()
    }

    // If transaction succeeded, ensure it's marked as completed
    if (payload.status === 'SUCCESSFUL') {
      updateData.momo_financial_transaction_id = payload.financialTransactionId
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update transaction',
          details: updateError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log webhook event
    const { error: logError } = await supabase
      .from('transaction_sync_log')
      .insert({
        user_id: transaction.user_id,
        sync_type: 'webhook',
        sync_status: 'success',
        transactions_synced: 1,
        sync_completed_at: new Date().toISOString(),
        momo_account_id: null // We don't have this context in webhook
      })

    if (logError) {
      console.warn('Failed to log webhook event:', logError)
    }

    console.log('Transaction updated successfully:', {
      transactionId: transaction.id,
      externalId: payload.externalId,
      newStatus: payload.status
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        transactionId: transaction.id,
        status: payload.status
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
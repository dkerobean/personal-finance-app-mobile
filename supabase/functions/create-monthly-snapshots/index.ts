import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NetWorthData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  assetsBreakdown: any[];
  liabilitiesBreakdown: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting monthly net worth snapshot creation...')

    // Get all users who have assets or liabilities (active users)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .or('id.in.(select user_id from assets where is_active = true),id.in.(select user_id from liabilities where is_active = true)')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = {
      totalUsers: users?.length || 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active users found', results }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Process each user
    for (const user of users) {
      try {
        const userId = user.id
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        // Check if snapshot already exists for this month
        const { data: existingSnapshot } = await supabase
          .from('net_worth_snapshots')
          .select('id')
          .eq('user_id', userId)
          .like('snapshot_date', `${currentMonth}%`)
          .limit(1)

        if (existingSnapshot && existingSnapshot.length > 0) {
          results.skipped++
          continue
        }

        // Calculate net worth for this user
        const netWorthData = await calculateNetWorth(supabase, userId)
        
        // Create snapshot
        const snapshotDate = now.toISOString().split('T')[0]
        const { error: insertError } = await supabase
          .from('net_worth_snapshots')
          .insert({
            user_id: userId,
            snapshot_date: snapshotDate,
            total_assets: netWorthData.totalAssets,
            total_liabilities: netWorthData.totalLiabilities,
            net_worth: netWorthData.netWorth,
            manual_assets_value: netWorthData.totalAssets,
            manual_liabilities_value: netWorthData.totalLiabilities,
            created_at: now.toISOString(),
          })

        if (insertError) {
          results.failed++
          results.errors.push(`User ${userId}: ${insertError.message}`)
        } else {
          results.successful++
        }

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        results.failed++
        results.errors.push(`User ${user.id}: ${error.message}`)
      }
    }

    console.log('Monthly snapshot creation completed:', results)

    return new Response(
      JSON.stringify({ 
        message: 'Monthly snapshot creation completed',
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in monthly snapshot function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function calculateNetWorth(supabase: any, userId: string): Promise<NetWorthData> {
  // Fetch assets
  const { data: assets } = await supabase
    .from('assets')
    .select('current_value')
    .eq('user_id', userId)
    .eq('is_active', true)

  // Fetch liabilities
  const { data: liabilities } = await supabase
    .from('liabilities')
    .select('current_balance')
    .eq('user_id', userId)
    .eq('is_active', true)

  // Fetch account balances
  const { data: accounts } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', userId)
    .eq('is_active', true)

  // Calculate totals
  const assetsTotal = (assets || []).reduce((total: number, asset: any) => total + Number(asset.current_value), 0)
  const accountsTotal = (accounts || []).reduce((total: number, account: any) => total + Number(account.balance || 0), 0)
  const totalAssets = assetsTotal + accountsTotal
  
  const totalLiabilities = (liabilities || []).reduce((total: number, liability: any) => total + Number(liability.current_balance), 0)
  
  const netWorth = totalAssets - totalLiabilities

  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    assetsBreakdown: [],
    liabilitiesBreakdown: [],
  }
}
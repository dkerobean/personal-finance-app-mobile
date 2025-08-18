# MTN MoMo Integration Setup Guide

This guide explains how to set up MTN Mobile Money (MoMo) integration for the Personal Finance App.

## Overview

The MTN MoMo integration allows users to:
- Link their MTN MoMo accounts
- Automatically sync transactions
- Categorize transactions as income or expense
- Receive real-time updates via webhooks

## Prerequisites

1. **MTN MoMo Developer Account**: Register at [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/)
2. **Subscription Key**: Obtain from MTN MoMo Developer Portal
3. **Webhook Endpoint**: For receiving transaction updates

## Environment Configuration

### 1. MTN MoMo API Settings

Add these variables to your `.env` file:

```bash
# MTN MoMo API Configuration
EXPO_PUBLIC_MTN_MOMO_SUBSCRIPTION_KEY=your_subscription_key_here
EXPO_PUBLIC_MTN_MOMO_BASE_URL_SANDBOX=https://sandbox.momodeveloper.mtn.com
EXPO_PUBLIC_MTN_MOMO_BASE_URL_PRODUCTION=https://api.momodeveloper.mtn.com
EXPO_PUBLIC_MTN_MOMO_TARGET_ENVIRONMENT=sandbox
EXPO_PUBLIC_MTN_MOMO_CALLBACK_HOST=your_callback_url_here
```

### 2. Callback URL Setup

The callback URL is where MTN MoMo will send transaction status updates.

#### Option A: Development with webhook.site

1. Go to [webhook.site](https://webhook.site)
2. Copy the unique URL (e.g., `https://webhook.site/12345678-1234-1234-1234-123456789abc`)
3. Set as `EXPO_PUBLIC_MTN_MOMO_CALLBACK_HOST`

#### Option B: Development with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your local server (if running on port 3000)
ngrok http 3000

# Copy the HTTPS URL from ngrok output
# Set as EXPO_PUBLIC_MTN_MOMO_CALLBACK_HOST
```

#### Option C: Production with Supabase Edge Functions

1. Deploy the webhook function:
```bash
supabase functions deploy momo-webhook
```

2. Get the function URL:
```bash
# Format: https://your-project.supabase.co/functions/v1/momo-webhook
EXPO_PUBLIC_MTN_MOMO_CALLBACK_HOST=https://your-project.supabase.co/functions/v1/momo-webhook
```

## Database Setup

The MTN MoMo integration requires additional database tables and columns:

### 1. Run the Schema Migration

Execute the SQL schema in `mtn-momo-schema.sql`:

```sql
-- Add MTN MoMo specific columns to transactions table
ALTER TABLE transactions 
ADD COLUMN momo_transaction_id TEXT,
ADD COLUMN momo_external_id TEXT,
ADD COLUMN momo_reference_id TEXT,
ADD COLUMN momo_status TEXT,
ADD COLUMN momo_payer_info JSONB,
ADD COLUMN momo_financial_transaction_id TEXT,
ADD COLUMN merchant_name TEXT,
ADD COLUMN location TEXT,
ADD COLUMN auto_categorized BOOLEAN DEFAULT false,
ADD COLUMN categorization_confidence NUMERIC(3,2);

-- Create MoMo account links table
CREATE TABLE momo_account_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction sync log table  
CREATE TABLE transaction_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  momo_account_id UUID REFERENCES momo_account_links(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  transactions_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_completed_at TIMESTAMP WITH TIME ZONE
);
```

### 2. Set Up Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE momo_account_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own MoMo accounts" ON momo_account_links
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own sync logs" ON transaction_sync_log
  FOR ALL USING (auth.uid() = user_id);
```

## Testing the Integration

### 1. Sandbox Testing

The integration defaults to sandbox mode for testing:

```typescript
// Test transaction flow
import { mtnMomoService } from '@/services/api/mtnMomoService';

// Initialize for sandbox
await mtnMomoService.initializeForSandbox();

// Process a test payment
const result = await mtnMomoService.processPayment(
  '10.00',           // amount
  '233241234567',    // Ghana phone number
  'Test payment'     // description
);
```

### 2. Webhook Testing

1. **Trigger a test webhook**: Use the MTN MoMo developer portal or sandbox tools
2. **Check logs**: Monitor your webhook endpoint logs
3. **Verify database**: Check that transaction statuses are updated

### 3. UI Testing

1. **Account Linking**: Go to Settings → MTN MoMo Integration
2. **Link Account**: Enter a Ghana phone number (format: 233XXXXXXXXX)
3. **Sync Transactions**: Use the sync button to test transaction import
4. **View Results**: Check the transactions list for imported MTN MoMo transactions

## Production Deployment

### 1. Environment Updates

```bash
# Switch to production environment
EXPO_PUBLIC_MTN_MOMO_TARGET_ENVIRONMENT=production
EXPO_PUBLIC_MTN_MOMO_CALLBACK_HOST=https://your-project.supabase.co/functions/v1/momo-webhook
```

### 2. Deploy Webhook Function

```bash
# Deploy to Supabase
supabase functions deploy momo-webhook

# Set environment variables for the function
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Production Testing

1. Test with real MTN MoMo accounts
2. Monitor webhook delivery
3. Verify transaction synchronization
4. Test error scenarios

## Security Considerations

### 1. Webhook Security

- **Signature Verification**: The webhook function verifies HMAC SHA256 signatures
- **HTTPS Only**: All webhook endpoints must use HTTPS
- **Payload Validation**: All incoming webhook data is validated

#### Setting up Webhook Signature Verification

1. **Generate a webhook secret**:
```bash
# Generate a secure random secret
openssl rand -hex 32
```

2. **Set the secret in Supabase Edge Function**:
```bash
# Set the webhook secret as an environment variable
supabase secrets set MTN_MOMO_WEBHOOK_SECRET=your-generated-secret-here
```

3. **Configure MTN MoMo Developer Portal**:
   - In the MTN MoMo Developer Portal, set your webhook secret
   - The portal will use this secret to sign webhook payloads

4. **Signature Verification Process**:
   - MTN MoMo signs each webhook payload with HMAC SHA256
   - The signature is sent in the `X-Momo-Signature` header
   - The webhook function verifies the signature before processing
   - Invalid signatures are rejected with a 401 status

#### Example Signature Verification
```javascript
// The webhook function automatically verifies signatures like this:
const signature = req.headers.get('x-momo-signature')
const webhookSecret = Deno.env.get('MTN_MOMO_WEBHOOK_SECRET')
const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret)
```

### 2. API Security

- Store credentials securely using Expo SecureStore
- Use environment variables for sensitive configuration
- Implement proper error handling to avoid data leaks

### 3. Data Protection

- Enable RLS on all database tables
- Validate user permissions for all operations
- Log access attempts for auditing

## Monitoring and Debugging

### 1. Check Webhook Logs

```bash
# View Supabase function logs
supabase functions logs momo-webhook

# Filter for specific events
supabase functions logs momo-webhook --filter="MTN MoMo Webhook received"
```

### 2. Database Monitoring

```sql
-- Check recent sync attempts
SELECT * FROM transaction_sync_log 
ORDER BY created_at DESC 
LIMIT 10;

-- Check webhook-updated transactions
SELECT * FROM transactions 
WHERE momo_financial_transaction_id IS NOT NULL 
ORDER BY updated_at DESC;
```

### 3. Common Issues

1. **Webhook not receiving calls**: Check callback URL configuration
2. **Authentication failures**: Verify subscription key and credentials
3. **Transaction not found**: Check external ID mapping
4. **Database errors**: Verify RLS policies and permissions

## API Reference

### MTN MoMo Service Methods

```typescript
// Initialize sandbox environment
await mtnMomoService.initializeForSandbox()

// Process payment with polling
await mtnMomoService.processPayment(amount, phoneNumber, description)

// Get account balance
await mtnMomoService.getAccountBalance()

// Get transaction status
await mtnMomoService.getTransactionStatus(referenceId)
```

### Transaction Sync Service Methods

```typescript
// Link MoMo account
await transactionSyncService.linkMoMoAccount({
  phone_number: '233241234567',
  account_name: 'My MTN Account'
})

// Sync transactions
await transactionSyncService.syncTransactionsFromMoMo()

// Get MoMo transactions
await transactionSyncService.getMoMoTransactions()
```

## Support

For issues with MTN MoMo integration:

1. Check the [MTN MoMo Developer Documentation](https://momodeveloper.mtn.com/docs/)
2. Review the webhook logs in Supabase
3. Test with sandbox environment first
4. Verify environment variable configuration
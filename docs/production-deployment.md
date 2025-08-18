# Production Deployment Guide - MTN MoMo Integration

This guide covers deploying the Personal Finance App with MTN MoMo integration to production.

## Prerequisites

Before deploying to production, ensure you have:

1. **MTN MoMo Production Account**: 
   - Approved production API access from MTN MoMo
   - Production subscription key
   - Production webhook callback URL

2. **Supabase Production Project**:
   - Production Supabase project set up
   - Database schema migrated
   - Row Level Security (RLS) policies configured

3. **App Store/Play Store Accounts**:
   - iOS App Store Connect account (for iOS deployment)
   - Google Play Console account (for Android deployment)

## Step 1: Environment Configuration

### 1.1 Production Environment Variables

Update your production environment variables:

```bash
# Production Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

# Production MTN MoMo Configuration
EXPO_PUBLIC_MTN_MOMO_SUBSCRIPTION_KEY=your_production_subscription_key
EXPO_PUBLIC_MTN_MOMO_BASE_URL_SANDBOX=https://sandbox.momodeveloper.mtn.com
EXPO_PUBLIC_MTN_MOMO_BASE_URL_PRODUCTION=https://api.momodeveloper.mtn.com
EXPO_PUBLIC_MTN_MOMO_TARGET_ENVIRONMENT=production
EXPO_PUBLIC_MTN_MOMO_CALLBACK_HOST=https://your-production-project.supabase.co/functions/v1/momo-webhook

# Production Resend Configuration (if using email verification)
EXPO_PUBLIC_RESEND_API_KEY=your_production_resend_key
```

### 1.2 Supabase Edge Function Secrets

Set production secrets for your Supabase Edge Function:

```bash
# Generate a secure webhook secret
WEBHOOK_SECRET=$(openssl rand -hex 32)

# Set secrets in Supabase
supabase secrets set SUPABASE_URL=https://your-production-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
supabase secrets set MTN_MOMO_WEBHOOK_SECRET=$WEBHOOK_SECRET

# Display the webhook secret for MTN MoMo configuration
echo "Your webhook secret (configure this in MTN MoMo portal): $WEBHOOK_SECRET"
```

## Step 2: Database Setup and Migration

### 2.1 Run Production Schema Migration

```sql
-- Execute this in your production Supabase SQL editor

-- Add MTN MoMo specific columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS momo_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS momo_external_id TEXT,
ADD COLUMN IF NOT EXISTS momo_reference_id TEXT,
ADD COLUMN IF NOT EXISTS momo_status TEXT,
ADD COLUMN IF NOT EXISTS momo_payer_info JSONB,
ADD COLUMN IF NOT EXISTS momo_financial_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS merchant_name TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS auto_categorized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS categorization_confidence NUMERIC(3,2);

-- Create MoMo account links table
CREATE TABLE IF NOT EXISTS momo_account_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transaction sync log table  
CREATE TABLE IF NOT EXISTS transaction_sync_log (
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

-- Enable RLS
ALTER TABLE momo_account_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own MoMo accounts" ON momo_account_links
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own sync logs" ON transaction_sync_log
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_momo_account_links_user_id ON momo_account_links(user_id);
CREATE INDEX IF NOT EXISTS idx_momo_account_links_phone_number ON momo_account_links(phone_number);
CREATE INDEX IF NOT EXISTS idx_transaction_sync_log_user_id ON transaction_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_momo_external_id ON transactions(momo_external_id);
CREATE INDEX IF NOT EXISTS idx_transactions_momo_status ON transactions(momo_status);
```

### 2.2 Verify Database Setup

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('momo_account_links', 'transaction_sync_log');

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('momo_account_links', 'transaction_sync_log', 'transactions');

-- Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('momo_account_links', 'transaction_sync_log', 'transactions')
AND schemaname = 'public';
```

## Step 3: Deploy Supabase Edge Function

### 3.1 Deploy Webhook Function

```bash
# Deploy the webhook function to production
supabase functions deploy momo-webhook --project-ref your-production-project-ref

# Verify deployment
supabase functions list --project-ref your-production-project-ref

# Test the webhook endpoint
curl -X POST \
  https://your-production-project.supabase.co/functions/v1/momo-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "deployment"}'
```

### 3.2 Monitor Function Logs

```bash
# View real-time logs
supabase functions logs momo-webhook --project-ref your-production-project-ref

# View logs with filters
supabase functions logs momo-webhook \
  --project-ref your-production-project-ref \
  --filter="MTN MoMo Webhook"
```

## Step 4: MTN MoMo Production Configuration

### 4.1 Update MTN MoMo Developer Portal

1. **Switch to Production Environment**:
   - Log into [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/)
   - Navigate to your production app configuration
   - Update environment from sandbox to production

2. **Configure Production Webhook**:
   - Webhook URL: `https://your-production-project.supabase.co/functions/v1/momo-webhook`
   - Webhook Secret: Use the secret generated in Step 1.2
   - Events: Transaction status changes

3. **Update API Configuration**:
   - Verify production subscription key
   - Update callback URLs
   - Test API connectivity

### 4.2 Production API Testing

```bash
# Test production API connectivity (replace with actual values)
curl -X POST \
  https://api.momodeveloper.mtn.com/collection/v1_0/requesttopay \
  -H "Authorization: Bearer YOUR_PRODUCTION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: YOUR_PRODUCTION_SUBSCRIPTION_KEY" \
  -d '{
    "amount": "1.00",
    "currency": "GHS",
    "externalId": "test-prod-123",
    "payer": {
      "partyIdType": "MSISDN",
      "partyId": "233241234567"
    },
    "payerMessage": "Production test",
    "payeeNote": "Testing production deployment"
  }'
```

## Step 5: Mobile App Build and Deployment

### 5.1 Build Production App

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm test

# Build for production
eas build --platform all --profile production

# Or build separately
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 5.2 Configure EAS Build

Update `eas.json` for production:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-production-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your_production_anon_key",
        "EXPO_PUBLIC_MTN_MOMO_SUBSCRIPTION_KEY": "your_production_subscription_key",
        "EXPO_PUBLIC_MTN_MOMO_TARGET_ENVIRONMENT": "production",
        "EXPO_PUBLIC_MTN_MOMO_CALLBACK_HOST": "https://your-production-project.supabase.co/functions/v1/momo-webhook"
      },
      "distribution": "store",
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "appBundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./path-to-service-account-key.json",
        "track": "production"
      }
    }
  }
}
```

### 5.3 Submit to App Stores

```bash
# Submit to iOS App Store
eas submit --platform ios --profile production

# Submit to Google Play Store
eas submit --platform android --profile production
```

## Step 6: Production Monitoring and Observability

### 6.1 Set Up Monitoring

1. **Supabase Monitoring**:
   - Enable database metrics monitoring
   - Set up alerts for function errors
   - Monitor API usage and rate limits

2. **Application Monitoring**:
   - Implement crash reporting (Sentry)
   - Monitor app performance metrics
   - Track user adoption and engagement

### 6.2 Health Check Endpoints

Create a health check function:

```typescript
// supabase/functions/health-check/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      database: "ok", // Check database connectivity
      webhook: "ok",  // Check webhook endpoint
    }
  }

  return new Response(JSON.stringify(health), {
    headers: { "Content-Type": "application/json" },
  })
})
```

### 6.3 Production Logs and Alerts

```bash
# Set up log monitoring
supabase functions logs momo-webhook \
  --project-ref your-production-project-ref \
  --filter="ERROR" \
  --tail

# Monitor specific error patterns
supabase functions logs momo-webhook \
  --project-ref your-production-project-ref \
  --filter="signature verification failed" \
  --tail
```

## Step 7: Security Hardening

### 7.1 Production Security Checklist

- [ ] All environment variables are production values
- [ ] Webhook signature verification is enabled
- [ ] Database RLS policies are active and tested
- [ ] API keys are properly secured
- [ ] HTTPS is enforced for all endpoints
- [ ] Error messages don't leak sensitive information
- [ ] Rate limiting is configured
- [ ] User input validation is comprehensive

### 7.2 Security Testing

```bash
# Test webhook security
curl -X POST \
  https://your-production-project.supabase.co/functions/v1/momo-webhook \
  -H "Content-Type: application/json" \
  -H "X-Momo-Signature: invalid-signature" \
  -d '{"externalId": "test", "status": "SUCCESSFUL"}'

# Should return 401 Unauthorized

# Test database security
# Verify RLS policies prevent unauthorized access
```

## Step 8: Launch and Post-Deployment

### 8.1 Soft Launch

1. **Internal Testing**:
   - Test with real MTN MoMo accounts
   - Verify webhook delivery and processing
   - Test transaction sync functionality
   - Validate error handling

2. **Beta Testing**:
   - Release to limited user group
   - Monitor for issues and performance
   - Collect feedback on UX/UI
   - Test with various MTN MoMo account types

### 8.2 Production Launch

1. **Go Live**:
   - Release to app stores
   - Monitor initial user adoption
   - Watch for errors and performance issues
   - Be ready for hot fixes

2. **Post-Launch Monitoring**:
   - Monitor webhook delivery rates
   - Track transaction success rates
   - Monitor app crash rates
   - Analyze user engagement metrics

## Step 9: Maintenance and Updates

### 9.1 Regular Maintenance Tasks

- [ ] Monitor MTN MoMo API status and updates
- [ ] Update dependencies and security patches
- [ ] Review and update webhook signatures
- [ ] Monitor database performance and optimize queries
- [ ] Review and update RLS policies as needed

### 9.2 Backup and Disaster Recovery

```bash
# Set up automated database backups
# Configure backup retention policies
# Test restoration procedures

# Monitor backup status
supabase db backup list --project-ref your-production-project-ref
```

### 9.3 Performance Optimization

1. **Database Performance**:
   - Monitor slow queries
   - Optimize indexes
   - Review connection pooling

2. **Function Performance**:
   - Monitor webhook response times
   - Optimize function memory usage
   - Review timeout configurations

## Troubleshooting Common Production Issues

### Issue 1: Webhook Not Receiving Calls

**Symptoms**: MTN MoMo transactions not updating in app

**Solutions**:
```bash
# Check webhook URL configuration
curl -X POST https://your-production-project.supabase.co/functions/v1/momo-webhook

# Verify MTN MoMo portal configuration
# Check webhook secret configuration
# Review firewall and network settings
```

### Issue 2: Signature Verification Failures

**Symptoms**: Webhooks receiving 401 errors

**Solutions**:
```bash
# Verify webhook secret matches MTN MoMo portal
supabase secrets list --project-ref your-production-project-ref

# Check signature format in logs
supabase functions logs momo-webhook --filter="signature"
```

### Issue 3: Database Connection Issues

**Symptoms**: App unable to sync transactions

**Solutions**:
```bash
# Check database connectivity
# Verify RLS policies
# Monitor connection limits
# Review API key permissions
```

## Support and Resources

- **MTN MoMo Developer Support**: [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/)
- **Supabase Documentation**: [Supabase Docs](https://supabase.com/docs)
- **Expo Documentation**: [Expo Docs](https://docs.expo.dev/)

## Emergency Contacts

Ensure your team has:
- MTN MoMo technical support contact
- Supabase support access
- App store emergency contact information
- On-call developer rotation schedule

---

**Note**: This deployment guide should be reviewed and tested in a staging environment before production deployment. Always have a rollback plan ready.
# MTN MoMo API Setup Guide

This guide will help you set up MTN Mobile Money API credentials for both sandbox (development) and production environments.

## Prerequisites

1. A valid email address
2. For production: A registered MTN SIM card that can receive OTP
3. For production: A valid business in Ghana

## Sandbox Environment Setup (Development)

### Step 1: Register at MTN MoMo Developer Portal

1. Visit [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/)
2. Click "Sign Up" and create your developer account
3. Verify your email address
4. Log in to your developer account

### Step 2: Subscribe to Products

1. In the developer portal, navigate to "Products"
2. Subscribe to the following products (these are free for sandbox):
   - **Collections**: For receiving payments
   - **Disbursements**: For sending payments (optional)
   - **Remittances**: For cross-border transfers (optional)

3. After subscribing, you'll receive **Subscription Keys** for each product

### Step 3: Generate API User and API Key

The API User and API Key are generated programmatically in sandbox. You'll need to make API calls to create them:

#### Generate API User

```bash
# Replace {subscription-key} with your Collections subscription key
curl -X POST \
  https://sandbox.momodeveloper.mtn.com/v1_0/apiuser \
  -H 'X-Reference-Id: {your-reference-id}' \
  -H 'Ocp-Apim-Subscription-Key: {subscription-key}' \
  -H 'Content-Type: application/json' \
  -d '{
    "providerCallbackHost": "your-callback-host.com"
  }'
```

#### Generate API Key

```bash
# Use the same reference ID from above
curl -X POST \
  https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/{reference-id}/apikey \
  -H 'Ocp-Apim-Subscription-Key: {subscription-key}'
```

### Step 4: Set Environment Variables

Create these environment variables in your Supabase Edge Functions:

```bash
# MTN MoMo Sandbox Credentials
MTN_ENVIRONMENT=sandbox
MTN_COLLECTIONS_SUBSCRIPTION_KEY=your_collections_subscription_key
MTN_DISBURSEMENTS_SUBSCRIPTION_KEY=your_disbursements_subscription_key
MTN_API_USER=your_generated_api_user
MTN_API_KEY=your_generated_api_key
MTN_BASE_URL=https://sandbox.momodeveloper.mtn.com
```

## Production Environment Setup

### Step 1: Contact MTN for Partner Portal Access

1. Contact MTN Ghana business team or your account manager
2. Request access to the **Partner Portal** for MoMo API
3. Complete the business verification process
4. Provide required business documentation

### Step 2: Partner Portal Setup

1. Once approved, you'll receive:
   - Partner Portal login credentials (e.g., `username.sp1`)
   - Instructions for accessing the portal

2. Log in to the Partner Portal using:
   - Your provided username
   - Your registered MTN SIM card for OTP verification

### Step 3: Generate Production Credentials

In the Partner Portal:
1. Navigate to API management section
2. Generate your production API User and API Key
3. Download or copy your credentials securely

### Step 4: Set Production Environment Variables

```bash
# MTN MoMo Production Credentials
MTN_ENVIRONMENT=production
MTN_COLLECTIONS_SUBSCRIPTION_KEY=your_production_collections_key
MTN_DISBURSEMENTS_SUBSCRIPTION_KEY=your_production_disbursements_key
MTN_API_USER=your_production_api_user
MTN_API_KEY=your_production_api_key
MTN_BASE_URL=https://api.mtn.com
```

## Setting Up Environment Variables in Supabase

### Method 1: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" → "Settings" → "Environment Variables"
3. Add each environment variable listed above

### Method 2: Supabase CLI

```bash
# Set environment variables using Supabase CLI
supabase secrets set MTN_ENVIRONMENT=sandbox
supabase secrets set MTN_COLLECTIONS_SUBSCRIPTION_KEY=your_key
supabase secrets set MTN_API_USER=your_api_user
supabase secrets set MTN_API_KEY=your_api_key
# ... repeat for all variables
```

## Testing Your Setup

### Test API Connection

Use this curl command to test your sandbox connection:

```bash
curl -X POST \
  https://sandbox.momodeveloper.mtn.com/collection/token/ \
  -H 'Authorization: Basic {base64_encoded_api_user:api_key}' \
  -H 'Ocp-Apim-Subscription-Key: {collections_subscription_key}' \
  -H 'X-Target-Environment: sandbox'
```

### Test Edge Function

Once your environment variables are set, test your Edge Function:

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/accounts-sync \
  -H 'Authorization: Bearer your_user_jwt_token' \
  -H 'Content-Type: application/json' \
  -d '{"accountId": "your_momo_account_id"}'
```

## Important Security Notes

1. **Never commit API keys to version control**
2. **Use environment variables for all credentials**
3. **Rotate keys regularly in production**
4. **Monitor API usage and set up alerts**
5. **Keep sandbox and production credentials separate**

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check your subscription key is correct
2. **401 Unauthorized**: Verify API User and API Key are properly encoded
3. **404 Not Found**: Ensure you're using the correct base URL for your environment
4. **Rate Limiting**: MTN has rate limits - implement exponential backoff

### Support Contacts

- **Sandbox Issues**: [MTN Developer Community](https://momodevelopercommunity.mtn.com/)
- **Production Issues**: Contact your MTN account manager
- **Technical Documentation**: [MTN MoMo API Docs](https://momodeveloper.mtn.com/api-documentation)

## Next Steps

After setting up your credentials:

1. Test the connection with a simple API call
2. Verify your Edge Functions can authenticate with MTN
3. Test transaction syncing with small amounts
4. Implement proper error handling and logging
5. Set up monitoring and alerting for production

---

For additional help, check the [MTN MoMo Developer Community](https://momodevelopercommunity.mtn.com/) or contact our support team.
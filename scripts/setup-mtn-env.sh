#!/bin/bash

# MTN MoMo Environment Setup Script
# This script helps you set up MTN MoMo API environment variables in Supabase

echo "🚀 MTN MoMo API Environment Setup"
echo "================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in to Supabase
if ! supabase auth whoami &> /dev/null; then
    echo "❌ You are not logged in to Supabase. Please login first:"
    echo "   supabase auth login"
    exit 1
fi

echo "✅ Supabase authentication verified"
echo ""

# Ask for environment type
echo "Which environment are you setting up?"
echo "1) Sandbox (Development)"
echo "2) Production"
read -p "Enter your choice (1 or 2): " env_choice

case $env_choice in
    1)
        MTN_ENVIRONMENT="sandbox"
        MTN_BASE_URL="https://sandbox.momodeveloper.mtn.com"
        echo "📦 Setting up SANDBOX environment"
        ;;
    2)
        MTN_ENVIRONMENT="production"
        MTN_BASE_URL="https://api.mtn.com"
        echo "🏭 Setting up PRODUCTION environment"
        ;;
    *)
        echo "❌ Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""

# Collect credentials
echo "Please enter your MTN MoMo API credentials:"
echo "(You can find these in the MTN Developer Portal)"
echo ""

read -p "Collections Subscription Key: " MTN_COLLECTIONS_SUBSCRIPTION_KEY
read -p "API User: " MTN_API_USER
read -s -p "API Key: " MTN_API_KEY
echo ""

# Optional: Disbursements
read -p "Disbursements Subscription Key (optional): " MTN_DISBURSEMENTS_SUBSCRIPTION_KEY

echo ""
echo "🔧 Setting environment variables in Supabase..."

# Set the environment variables
supabase secrets set MTN_ENVIRONMENT="$MTN_ENVIRONMENT"
supabase secrets set MTN_BASE_URL="$MTN_BASE_URL"
supabase secrets set MTN_COLLECTIONS_SUBSCRIPTION_KEY="$MTN_COLLECTIONS_SUBSCRIPTION_KEY"
supabase secrets set MTN_API_USER="$MTN_API_USER"
supabase secrets set MTN_API_KEY="$MTN_API_KEY"

if [ ! -z "$MTN_DISBURSEMENTS_SUBSCRIPTION_KEY" ]; then
    supabase secrets set MTN_DISBURSEMENTS_SUBSCRIPTION_KEY="$MTN_DISBURSEMENTS_SUBSCRIPTION_KEY"
fi

echo ""
echo "✅ Environment variables set successfully!"
echo ""

# Test the setup
echo "🧪 Testing your MTN MoMo API setup..."
echo ""

# Create a test script
cat > test_mtn_connection.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

async function testMtnConnection() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.log('❌ Supabase URL and Anon Key are required in your .env file');
            return;
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test edge function
        const { data, error } = await supabase.functions.invoke('test-mtn-connection');
        
        if (error) {
            console.log('❌ Connection test failed:', error.message);
        } else {
            console.log('✅ MTN MoMo API connection successful!');
            console.log('Response:', data);
        }
    } catch (err) {
        console.log('❌ Test failed:', err.message);
    }
}

testMtnConnection();
EOF

echo "📋 Setup Summary:"
echo "================="
echo "Environment: $MTN_ENVIRONMENT"
echo "Base URL: $MTN_BASE_URL"
echo "Collections Key: ${MTN_COLLECTIONS_SUBSCRIPTION_KEY:0:8}..."
echo "API User: $MTN_API_USER"
echo "API Key: ${MTN_API_KEY:0:8}..."
echo ""

echo "🎉 MTN MoMo API setup complete!"
echo ""
echo "📚 Next Steps:"
echo "1. Deploy your Edge Functions: supabase functions deploy"
echo "2. Test your setup using the app"
echo "3. Check the MTN_MOMO_API_SETUP.md guide for more details"
echo ""

# Clean up test file
rm -f test_mtn_connection.js

echo "💡 Tip: Keep your credentials secure and never commit them to version control!"
echo ""
#!/bin/bash

# Deploy script for Supabase Edge Functions
echo "🚀 Starting deployment to Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   Visit: https://supabase.com/docs/guides/cli/getting-started"
    echo "   Or try: curl -fsSL https://supabase.com/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! supabase status &> /dev/null; then
    echo "❌ Please login to Supabase first:"
    echo "   supabase login"
    exit 1
fi

# Check if project is linked
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "❌ Project not linked. Please link your project first:"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma db push

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Deploy Edge Functions
echo "🚀 Deploying Edge Functions to Supabase..."
supabase functions deploy noteplanning-api

# Set environment variables for Edge Functions
echo "🔧 Setting environment variables for Edge Functions..."
supabase secrets set JWT_SECRET="$JWT_SECRET"
supabase secrets set ABACATEPAY_TOKEN_SECRET="$ABACATEPAY_TOKEN_SECRET"
supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"

echo "✅ Deployment completed!"
echo "🌐 Your Edge Function is available at:"
echo "   https://YOUR_PROJECT_REF.supabase.co/functions/v1/noteplanning-api"
echo ""
echo "📚 Available endpoints:"
echo "   GET  /health - Health check"
echo "   GET  /api/customers - List customers"
echo "   POST /api/customers - Create customer"
echo "   GET  /api/products - List products"
echo "   GET  /api/videos - List videos"
echo "   GET  /api/purchases - List purchases"
echo "   POST /api/purchases - Create purchase"
echo "   GET  /api/memberships - List memberships"
echo "   POST /api/abacatepay - AbacatePay webhook"
echo ""
echo "🔑 Make sure to set these environment variables in your Supabase project:"
echo "   - JWT_SECRET"
echo "   - ABACATEPAY_TOKEN_SECRET"
echo "   - RESEND_API_KEY"

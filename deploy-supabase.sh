#!/bin/bash

# Deploy script for Supabase
echo "🚀 Starting deployment to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# Check if user is logged in
if ! supabase status &> /dev/null; then
    echo "❌ Please login to Supabase first:"
    echo "   supabase login"
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma db push

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Deploy to Supabase (if using Supabase Edge Functions)
echo "🚀 Deploying to Supabase..."
echo "📝 Note: Make sure to configure your hosting platform (Vercel, Railway, etc.)"
echo "   with the following environment variables:"
echo "   - DATABASE_URL"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - JWT_SECRET"
echo "   - ABACATEPAY_TOKEN_SECRET"
echo "   - RESEND_API_KEY"

echo "✅ Deployment preparation completed!"
echo "🌐 Your app is ready to be deployed to your hosting platform"
echo "📚 Make sure to update your CORS_ORIGIN environment variable"

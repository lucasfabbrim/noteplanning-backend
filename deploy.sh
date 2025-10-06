#!/bin/bash

# Deploy script for Fly.io
echo "🚀 Starting deployment to Fly.io..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in
if ! fly auth whoami &> /dev/null; then
    echo "❌ Please login to Fly.io first:"
    echo "   fly auth login"
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

# Deploy to Fly.io
echo "🚀 Deploying to Fly.io..."
fly deploy

echo "✅ Deployment completed!"
echo "🌐 Your app is available at: https://noteplanning-backend.fly.dev"
echo "📚 API Documentation: https://noteplanning-backend.fly.dev/docs"
echo "🏥 Health Check: https://noteplanning-backend.fly.dev/health"

#!/bin/bash
# EtherealDimension Search v2 - Setup Script

set -e

echo "🚀 EtherealDimension Search v2 Setup"
echo "======================================"

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install Docker Desktop first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install Node.js 18+ first."
    exit 1
fi

echo "✅ Docker found"
echo "✅ Node.js $(node -v) found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Setup env file
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Edit .env.local with your API keys!"
fi

# Start Docker services
echo ""
echo "🐳 Starting Docker services (Neo4j, n8n, Redis)..."
docker-compose up -d

echo "⏳ Waiting for Neo4j to be ready..."
for i in {1..30}; do
    if docker exec ethd-neo4j neo4j status 2>/dev/null | grep -q "running"; then
        echo "✅ Neo4j is ready"
        break
    fi
    sleep 2
    echo "   Waiting... ($i/30)"
done

# Seed Neo4j
echo ""
echo "🌱 Seeding Neo4j with sample data..."
npx tsx scripts/seed-neo4j.ts || echo "⚠️  Neo4j seed skipped (may not be ready yet)"

# Summary
echo ""
echo "======================================"
echo "✅ Setup complete!"
echo ""
echo "📍 Services:"
echo "   Next.js:  http://localhost:3000  (run: pnpm dev)"
echo "   Neo4j:    http://localhost:7474  (user: neo4j, pass: etherealdimension)"
echo "   n8n:      http://localhost:5678  (user: admin, pass: etherealdimension)"
echo "   Redis:    localhost:6379"
echo ""
echo "📝 Next steps:"
echo "   1. Add API keys to .env.local"
echo "   2. Import n8n workflows from n8n-workflows/"
echo "   3. Run: pnpm dev"
echo ""

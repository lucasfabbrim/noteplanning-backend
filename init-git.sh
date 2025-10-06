#!/bin/bash

# Script para inicializar repositório Git
# Autor: Lucas Fabbri
# Data: 2025-10-06

echo "🚀 Inicializando repositório Git para noteplanning-backend..."

# 1. Inicializar Git (se não existir)
if [ ! -d ".git" ]; then
  echo "📁 Inicializando repositório Git..."
  git init
else
  echo "✅ Repositório Git já existe"
fi

# 2. Criar .gitignore se não existir
if [ ! -f ".gitignore" ]; then
  echo "📝 Criando .gitignore..."
  cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.*.local
.env.production
.env.development

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
pino-pretty*.log

# OS
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
coverage/
.nyc_output/
*.test.js
*.spec.js

# Uploads
uploads/
temp/

# Database
*.db
*.sqlite
*.sqlite3
prisma/migrations/

# Fly.io
fly.secrets.toml

# Misc
.cache/
.temp/
.tmp/
EOF
  echo "✅ .gitignore criado"
else
  echo "✅ .gitignore já existe"
fi

# 3. Adicionar todos os arquivos
echo "📦 Adicionando arquivos ao staging..."
git add .

# 4. Verificar o que será commitado
echo ""
echo "📋 Arquivos que serão commitados:"
git status --short

# 5. Fazer o commit inicial
echo ""
read -p "🤔 Deseja fazer o commit inicial? (s/n): " CONFIRM
if [ "$CONFIRM" = "s" ] || [ "$CONFIRM" = "S" ]; then
  echo "💾 Fazendo commit inicial..."
  git commit -m "feat: Initial commit - NotePlanning Backend

- Clean Architecture com Fastify + Prisma + PostgreSQL
- Autenticação JWT para Admin e Customer
- CRUD completo: Customer, Video, Membership, Admin, Purchase
- Webhook AbacatePay integrado
- Sistema de controle de acesso a vídeos baseado em compras
- Validação com Zod
- Documentação Swagger/OpenAPI
- Logs estruturados com Pino
- Docker e Fly.io ready
- Testes automatizados"
  
  echo "✅ Commit inicial realizado com sucesso!"
else
  echo "⏭️  Commit pulado. Você pode fazer manualmente com:"
  echo "   git commit -m 'sua mensagem'"
fi

# 6. Instruções para configurar remote
echo ""
echo "📡 Para adicionar um repositório remoto, execute:"
echo "   git remote add origin https://github.com/seu-usuario/noteplanning-backend.git"
echo ""
echo "📤 Para fazer push, execute:"
echo "   git push -u origin main"
echo ""
echo "✨ Repositório Git configurado com sucesso!"


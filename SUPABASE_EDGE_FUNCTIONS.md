# Supabase Edge Functions - NotePlanning API

Este projeto foi configurado para usar Supabase Edge Functions como API serverless.

## 🚀 Configuração Inicial

### 1. Instalar Supabase CLI

```bash
# Linux/macOS
curl -fsSL https://supabase.com/install.sh | sh

# Ou via npm (não recomendado para produção)
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Linkar o Projeto

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Configurar Variáveis de Ambiente

No painel do Supabase, vá em Settings > Edge Functions e configure:

```bash
JWT_SECRET=your-super-secret-jwt-key-here
ABACATEPAY_TOKEN_SECRET=your-abacatepay-token
RESEND_API_KEY=your-resend-api-key
```

## 🛠️ Comandos Disponíveis

### Desenvolvimento Local

```bash
# Iniciar Supabase localmente
npm run supabase:start

# Servir Edge Functions localmente
npm run supabase:functions:serve

# Parar Supabase local
npm run supabase:stop

# Ver status
npm run supabase:status
```

### Deploy

```bash
# Deploy completo (migrações + Edge Functions)
npm run supabase:deploy

# Deploy apenas Edge Functions
npm run supabase:functions:deploy

# Push do banco de dados
npm run supabase:db:push
```

## 📡 Endpoints Disponíveis

A Edge Function está disponível em:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/noteplanning-api`

### Rotas Disponíveis:

- `GET /health` - Health check
- `GET /api/customers` - Listar clientes (requer auth)
- `POST /api/customers` - Criar cliente (requer auth)
- `GET /api/products` - Listar produtos
- `GET /api/videos` - Listar vídeos
- `GET /api/purchases` - Listar compras (requer auth)
- `POST /api/purchases` - Criar compra (requer auth)
- `GET /api/memberships` - Listar assinaturas (requer auth)
- `POST /api/abacatepay` - Webhook AbacatePay

## 🔐 Autenticação

A Edge Function usa o sistema de autenticação do Supabase. Para fazer requisições autenticadas:

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Usar o token nas requisições
const response = await fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/noteplanning-api/api/customers', {
  headers: {
    'Authorization': `Bearer ${data.session.access_token}`,
    'Content-Type': 'application/json'
  }
})
```

## 🗄️ Banco de Dados

O banco de dados PostgreSQL do Supabase é usado diretamente. As migrações do Prisma são aplicadas via:

```bash
npm run supabase:db:push
```

## 🔧 Desenvolvimento

### Estrutura de Arquivos

```
supabase/
├── config.toml                    # Configuração do Supabase
└── functions/
    └── noteplanning-api/
        └── index.ts               # Edge Function principal
```

### Testando Localmente

1. Inicie o Supabase local:
```bash
npm run supabase:start
```

2. Em outro terminal, sirva a Edge Function:
```bash
npm run supabase:functions:serve
```

3. Teste os endpoints:
```bash
curl http://localhost:54321/functions/v1/noteplanning-api/health
```

## 📝 Logs

Para ver logs das Edge Functions:

```bash
supabase functions logs noteplanning-api
```

## 🚀 Deploy em Produção

1. Configure as variáveis de ambiente no painel do Supabase
2. Execute o deploy:
```bash
npm run supabase:deploy
```

3. Sua API estará disponível em:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/noteplanning-api`

## 🔄 Migração do Fastify

A Edge Function substitui completamente o servidor Fastify, oferecendo:

- ✅ Serverless e escalável
- ✅ Integração nativa com Supabase Auth
- ✅ CORS configurado automaticamente
- ✅ Logs centralizados
- ✅ Deploy simplificado
- ✅ Sem necessidade de gerenciar servidor

## 📚 Documentação

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Deno Runtime](https://deno.land/manual)

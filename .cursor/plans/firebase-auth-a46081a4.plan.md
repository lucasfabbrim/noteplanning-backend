<!-- a46081a4-51ad-4eb9-9be5-9cce38cbd8f9 950c7dfb-c218-47db-be8a-cfcce0bdba03 -->
# Migração Firebase Auth e Testes Completos da API

## Análise da Situação Atual

**Problemas Identificados:**
1. ❌ Implementação híbrida: `functions/src/index.ts` tem lógica monolítica enquanto existe estrutura modular em `functions/src/server.ts`
2. ❌ Firebase Auth parcialmente implementado (apenas login/register no index.ts)
3. ❌ JWT customizado ainda está sendo usado no middleware
4. ❌ Endpoints de essays existem na estrutura modular mas não estão expostos no index.ts
5. ❌ Falta configuração de variáveis de ambiente para Firebase
6. ❌ Sem testes abrangentes

**Estrutura Correta Encontrada:**
- ✅ `functions/src/server.ts` - Build do Fastify com todas as rotas
- ✅ `functions/src/routes/` - Rotas modulares (auth, customers, essays, abacatepay)
- ✅ `functions/src/controllers/` - Controllers implementados
- ✅ `functions/src/services/` - Services implementados
- ✅ `functions/prisma/schema.prisma` - Schema do banco

## Plano de Implementação

### 1. Migrar Completamente para Firebase Auth

**Arquivos a Modificar:**
- `functions/src/middleware/auth.middleware.ts` - Trocar JWT por Firebase Auth Admin SDK
- `functions/src/services/customer.service.ts` - Integrar criação de usuários no Firebase Auth
- `functions/src/routes/auth.routes.ts` - Atualizar login/register para Firebase Auth

**Implementação:**
- Usar `admin.auth().verifyIdToken()` no middleware para validar tokens
- Criar usuários no Firebase Auth + Prisma simultaneamente no register
- Login retorna custom token do Firebase que o cliente troca por ID token
- Remover completamente dependência de `jsonwebtoken`

### 2. Corrigir Firebase Functions Entry Point

**Arquivo Principal:** `functions/src/index.ts`

**Mudanças:**
- Remover toda lógica monolítica (handlers `handleGet`, `handlePost`)
- Importar `buildServer` de `server.ts`
- Expor o Fastify app através do Firebase Functions v2
- Manter apenas Firebase Admin initialization

```typescript
import { onRequest } from "firebase-functions/v2/https";
import { buildServer } from "./server";

export const api = onRequest({
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "1GiB",
}, async (req, res) => {
  const app = await buildServer();
  await app.ready();
  app.server.emit('request', req, res);
});
```

### 3. Configurar Variáveis de Ambiente

**Criar:** `functions/.env.example`

Variáveis necessárias:
- DATABASE_URL (Supabase PostgreSQL)
- FIREBASE_PROJECT_ID
- NODE_ENV
- LOG_LEVEL
- MAX_FILE_SIZE

**Configurar:** Firebase Functions config para produção

### 4. Implementar Sistema de Créditos

Verificar se está completo:
- GET /v1/credits
- GET /v1/credits-history
- POST /v1/credits (admin)
- PATCH /v1/credits/:id (admin)

### 5. Criar Suite Completa de Testes em curl

**Arquivo:** `test-api.sh`

**Estrutura:**
```bash
#!/bin/bash
# Testes organizados por módulo:
# 1. Health Check
# 2. Auth (register, login, logout)
# 3. Customers (CRUD completo, admin only)
# 4. Essays (create, list, get, update, delete)
# 5. Credits (list, add, use)
# 6. Credits History
# 7. Purchases
# 8. Webhooks (AbacatePay)
```

Cada teste terá:
- ✅ Descrição do que testa
- ✅ Comando curl completo
- ✅ Response esperado
- ✅ Validação de status code

### 6. Documentação de Endpoints

**Atualizar:** `API_DOCUMENTATION.md`

Adicionar:
- Endpoints de essays com payloads completos
- Sistema de créditos
- Autenticação com Firebase (fluxo completo)
- Exemplos de erro

### 7. Build e Deploy

**Passos:**
1. Compilar TypeScript: `npm run build` em `/functions`
2. Testar localmente com emulador: `firebase emulators:start`
3. Validar todos endpoints com script de teste
4. Deploy: `firebase deploy --only functions`

## Endpoints a Testar

### Autenticação (3 endpoints)
- POST /v1/auth/register
- POST /v1/auth/login
- POST /v1/auth/logout

### Customers (7 endpoints)
- GET /v1/customers (admin)
- GET /v1/customers/:id (admin)
- GET /v1/customers/email/:email (admin)
- PUT /v1/customers/:id (admin)
- DELETE /v1/customers/:id (admin)
- POST /v1/customers/forgot-password (admin)
- POST /v1/customers/reset-password (admin)

### Essays (9 endpoints)
- GET /v1/essays/test
- POST /v1/essays (authenticated)
- GET /v1/essays/my (authenticated)
- GET /v1/essays/:id (authenticated)
- GET /v1/essays/customer/:customerId (admin)
- GET /v1/essays/status/:status (admin)
- PATCH /v1/essays/:id/status (admin)
- PATCH /v1/essays/:id/scores (admin)
- PATCH /v1/essays/:id/analysis (admin)
- DELETE /v1/essays/:id (admin)
- GET /v1/essays/stats (admin)

### Credits (endpoints a verificar/implementar)
- GET /v1/credits
- GET /v1/credits-history
- GET /v1/purchases

### Webhook (2 endpoints)
- GET /webhook/abacatepay
- POST /webhook/abacatepay

### Health (2 endpoints)
- GET /health
- GET /docs

**Total: ~30 endpoints**

## Vali
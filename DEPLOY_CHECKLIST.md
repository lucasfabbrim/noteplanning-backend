# Deploy Checklist - NotePlanning Backend

## ✅ Status da Aplicação

### Funcionalidades Implementadas

- ✅ **Clean Architecture** - Separação em camadas (controllers, services, repositories, validators, routes)
- ✅ **Autenticação JWT** - Login de Admin e Customer com tokens JWT
- ✅ **Autorização** - Middleware `requireAdmin` para proteger endpoints sensíveis
- ✅ **CRUD Completo**:
  - ✅ Customers
  - ✅ Videos
  - ✅ Memberships
  - ✅ Admins
  - ✅ Purchases (histórico de compras)
- ✅ **Webhook AbacatePay** - Recebe webhooks e cria automaticamente Customer + Purchase
- ✅ **Controle de Acesso a Vídeos** - Baseado em histórico de compras (Purchase)
- ✅ **Validação Zod** - Todos os inputs validados
- ✅ **Soft Delete** - Todos os modelos suportam `deactivatedAt`
- ✅ **Paginação e Filtros** - GET endpoints com suporte a filtros
- ✅ **Swagger/OpenAPI** - Documentação completa em `/docs`
- ✅ **Logs com Pino** - Logging estruturado e detalhado
- ✅ **Error Handling** - Tratamento centralizado de erros
- ✅ **TypeScript** - Tipagem forte e build funcionando
- ✅ **Prisma ORM** - PostgreSQL com Prisma Client
- ✅ **Docker Ready** - Dockerfile e .dockerignore configurados
- ✅ **Fly.io Ready** - fly.toml e deploy.sh prontos

---

## 📋 Pré-requisitos para Deploy

### 1. Variáveis de Ambiente

Certifique-se de configurar todas as variáveis no Fly.io:

```bash
fly secrets set \
  DATABASE_URL="sua-connection-string-postgresql" \
  JWT_SECRET="seu-secret-jwt-min-32-chars" \
  ABACATEPAY_TOKEN_SECRET="seu-token-abacatepay" \
  NODE_ENV="production"
```

### 2. Banco de Dados

- ✅ PostgreSQL configurado (Supabase ou outro provider)
- ✅ Schema aplicado via `prisma db push` ou migrations
- ✅ Seed executado (`npm run db:seed`) para criar admin inicial

### 3. Build e Testes Locais

```bash
# Build
npm run build

# Testes
npm test

# Servidor local
npm run dev
```

---

## 🚀 Deploy no Fly.io

### Passo 1: Instalar Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### Passo 2: Login

```bash
fly auth login
```

### Passo 3: Criar App (se não existir)

```bash
fly apps create noteplanning-backend
```

### Passo 4: Configurar Secrets

```bash
fly secrets set \
  DATABASE_URL="postgresql://..." \
  JWT_SECRET="..." \
  ABACATEPAY_TOKEN_SECRET="..." \
  NODE_ENV="production"
```

### Passo 5: Deploy

```bash
fly deploy
```

Ou use o script:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Passo 6: Verificar Status

```bash
fly status
fly logs
fly open
```

---

## 🧪 Endpoints para Testar Após Deploy

### Health Check
```bash
curl https://noteplanning-backend.fly.dev/health
```

### Login Admin
```bash
curl -X POST https://noteplanning-backend.fly.dev/api/admins/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Swagger Docs
```
https://noteplanning-backend.fly.dev/docs
```

### Webhook (use seu secret)
```bash
curl -X POST "https://noteplanning-backend.fly.dev/webhook/abacatepay?webhookSecret=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "billing": {
        "customer": {
          "metadata": {
            "name": "Test Customer",
            "email": "test@example.com",
            "cellphone": "11999999999"
          }
        },
        "amount": 99.90
      },
      "payment": {
        "amount": 99.90
      }
    },
    "products": [
      {
        "id": "prod-1",
        "name": "Template + Videos",
        "quantity": 1,
        "price": 99.90
      }
    ],
    "event": "payment.completed",
    "devMode": false
  }'
```

---

## 📝 Estrutura do Projeto

```
noteplanning-backend/
├── prisma/
│   ├── schema.prisma          # Modelos do banco de dados
│   └── seed.ts                # Seed inicial
├── src/
│   ├── config/                # Configurações (env, database, logger)
│   ├── controllers/           # Controllers (request/response)
│   ├── services/              # Lógica de negócio
│   ├── repositories/          # Acesso ao banco (Prisma)
│   ├── validators/            # Schemas Zod
│   ├── routes/                # Definição de rotas
│   ├── middleware/            # Auth, error handling, video access
│   ├── errors/                # Custom errors
│   ├── tests/                 # Testes automatizados
│   └── server.ts              # Entrada principal
├── Dockerfile                 # Build Docker
├── fly.toml                   # Config Fly.io
├── deploy.sh                  # Script de deploy
├── package.json               # Dependências
├── tsconfig.json              # Config TypeScript
└── README.md                  # Documentação principal
```

---

## 🔐 Segurança

- ✅ JWT para autenticação
- ✅ Senhas hasheadas com bcryptjs
- ✅ Validação de webhook secret
- ✅ CORS configurado
- ✅ Rate limiting (recomendado adicionar)
- ✅ Helmet (recomendado adicionar)

---

## 📊 Modelos do Banco de Dados

### Customer
- id, email, name, password, role, isActive
- Relations: memberships, videos, purchases

### Video
- id, title, description, url, thumbnail, duration, isPublished
- Relations: customer

### Membership
- id, customerId, startDate, endDate, isActive, planType
- Relations: customer

### Admin
- id, email, name, password, role, isActive

### Purchase (NEW)
- id, customerId, amount, paymentAmount, event, status
- customerName, customerEmail, customerPhone, customerTaxId
- products (JSON), webhookData (JSON), devMode
- Relations: customer

---

## 🎯 Sistema de Acesso a Vídeos

O sistema verifica automaticamente se um customer tem acesso aos vídeos baseado no histórico de compras:

1. **Webhook recebe compra** → Cria Customer + Purchase
2. **Purchase.products** contém nome do produto
3. **Middleware `requireVideoAccess`** verifica se o customer comprou produto com "template" ou "video" no nome
4. **Se sim** → Acesso liberado aos vídeos
5. **Se não** → 403 Forbidden

Endpoint para verificar acesso:
```
GET /api/purchases/customer/:customerId/video-access
```

---

## ⚠️ Avisos Importantes

1. **Nunca commite** `.env` ou secrets
2. **Use HTTPS** em produção
3. **Configure backups** do banco de dados
4. **Monitore logs** com `fly logs`
5. **Teste webhooks** em ambiente de homologação primeiro

---

## 📞 Suporte

- Documentação Fastify: https://fastify.dev
- Documentação Prisma: https://prisma.io/docs
- Documentação Fly.io: https://fly.io/docs
- Swagger da API: http://localhost:3000/docs

---

## ✅ Status Final

**Aplicação pronta para deploy no Fly.io!** 🚀

- ✅ Build funciona
- ✅ Testes passam
- ✅ Swagger documentado
- ✅ Webhook integrado
- ✅ Sistema de acesso implementado
- ✅ Docker configurado
- ✅ Fly.io configurado


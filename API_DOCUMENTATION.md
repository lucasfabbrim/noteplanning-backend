# 📚 NotePlanning Backend API - Documentação Completa

## 🚀 Visão Geral

A API do NotePlanning é um backend robusto construído com **Fastify**, **Prisma** e **PostgreSQL**, seguindo os princípios de **Clean Architecture**. Esta documentação apresenta todas as rotas disponíveis com exemplos detalhados de payloads de entrada e saída.

### 🔗 URLs Base
- **Desenvolvimento**: `http://localhost:3000`
- **Produção**: `https://noteplanning-backend.fly.dev`
- **Documentação Swagger**: `/docs`

### 🔐 Autenticação
A API utiliza **JWT Bearer Token** para autenticação. Inclua o token no header:
```
Authorization: Bearer <seu_token_jwt>
```

---

## 📋 Índice

1. [🔐 Autenticação](#-autenticação)
2. [👥 Clientes](#-clientes)
3. [📁 Categorias](#-categorias)
4. [🎥 Vídeos](#-vídeos)
5. [💳 Compras](#-compras)
6. [🔗 Webhooks](#-webhooks)
7. [🏥 Health Check](#-health-check)

---

## 🔐 Autenticação

### POST `/v1/auth/register`
**Descrição**: Registra um novo usuário no sistema

**Payload de Entrada**:
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "name": "João Silva"
}
```

**Resposta de Sucesso (201)**:
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "clx1234567890abcdef",
    "email": "usuario@exemplo.com",
    "name": "João Silva",
    "role": "FREE",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Resposta de Erro (409)**:
```json
{
  "success": false,
  "message": "Customer already exists"
}
```

---

### POST `/v1/auth/login`
**Descrição**: Autentica um usuário e retorna um token JWT

**Payload de Entrada**:
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Resposta de Erro (401)**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### POST `/v1/auth/logout`
**Descrição**: Faz logout do usuário

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👥 Clientes

### GET `/v1/customers`
**Descrição**: Lista todos os clientes (apenas Admin)
**Autenticação**: ✅ Admin

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": [
    {
      "id": "clx1234567890abcdef",
      "email": "usuario@exemplo.com",
      "name": "João Silva",
      "role": "FREE",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

---

### GET `/v1/customers/:id`
**Descrição**: Busca um cliente específico por ID (apenas Admin)
**Autenticação**: ✅ Admin

**Parâmetros**:
- `id` (string): ID único do cliente

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Customer found",
  "data": {
    "id": "clx1234567890abcdef",
    "email": "usuario@exemplo.com",
    "name": "João Silva",
    "role": "FREE",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "purchases": [
      {
        "id": "clx9876543210fedcba",
        "amount": 99.90,
        "status": "completed",
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

**Resposta de Erro (404)**:
```json
{
  "success": false,
  "message": "Customer not found"
}
```

---

### GET `/v1/customers/email/:email`
**Descrição**: Busca um cliente por email (apenas Admin)
**Autenticação**: ✅ Admin

**Parâmetros**:
- `email` (string): Email do cliente

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Customer found",
  "data": {
    "id": "clx1234567890abcdef",
    "email": "usuario@exemplo.com",
    "name": "João Silva",
    "role": "FREE",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### PUT `/v1/customers/:id`
**Descrição**: Atualiza dados de um cliente (apenas Admin)
**Autenticação**: ✅ Admin

**Payload de Entrada**:
```json
{
  "email": "novoemail@exemplo.com",
  "name": "João Silva Santos",
  "password": "novasenha123"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Customer updated successfully",
  "data": {
    "id": "clx1234567890abcdef",
    "email": "novoemail@exemplo.com",
    "name": "João Silva Santos",
    "role": "FREE",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

### DELETE `/v1/customers/:id`
**Descrição**: Remove um cliente (soft delete) (apenas Admin)
**Autenticação**: ✅ Admin

**Resposta de Sucesso (204)**: Sem conteúdo

---

### POST `/v1/customers/forgot-password`
**Descrição**: Solicita token para reset de senha (apenas Admin)
**Autenticação**: ✅ Admin

**Payload de Entrada**:
```json
{
  "email": "usuario@exemplo.com"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Reset token generated",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Apenas em desenvolvimento
}
```

---

### POST `/v1/customers/reset-password`
**Descrição**: Reseta senha usando token (apenas Admin)
**Autenticação**: ✅ Admin

**Payload de Entrada**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "novasenha123"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 💳 Compras

### GET `/v1/customers/purchases`
**Descrição**: Lista compras do usuário autenticado
**Autenticação**: ✅ Usuário

**Query Parameters**:
- `page` (string, opcional): Número da página (padrão: 1)
- `limit` (string, opcional): Itens por página (padrão: 10)
- `status` (string, opcional): Filtrar por status

**Exemplo de Requisição**:
```
GET /v1/customers/purchases?page=1&limit=5&status=completed
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Your purchases retrieved successfully",
  "data": [
    {
      "id": "clx9876543210fedcba",
      "amount": 99.90,
      "paymentAmount": 99.90,
      "event": "payment.completed",
      "status": "completed",
      "customerName": "João Silva",
      "customerEmail": "usuario@exemplo.com",
      "customerPhone": "+5511999999999",
      "customerTaxId": "12345678901",
      "products": [
        {
          "id": "prod_123",
          "name": "Curso Premium",
          "price": 99.90
        }
      ],
      "paymentMethod": "credit_card",
      "transactionId": "txn_abc123",
      "devMode": false,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z",
      "customer": {
        "id": "clx1234567890abcdef",
        "name": "João Silva",
        "email": "usuario@exemplo.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET `/v1/customers/:id/purchases`
**Descrição**: Lista compras de um cliente específico (apenas Admin)
**Autenticação**: ✅ Admin

**Query Parameters**: Mesmos do endpoint anterior

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Customer purchases retrieved successfully",
  "data": {
    "customer": {
      "id": "clx1234567890abcdef",
      "name": "João Silva",
      "email": "usuario@exemplo.com"
    },
    "purchases": [
      {
        "id": "clx9876543210fedcba",
        "amount": 99.90,
        "paymentAmount": 99.90,
        "event": "payment.completed",
        "status": "completed",
        "customerName": "João Silva",
        "customerEmail": "usuario@exemplo.com",
        "customerPhone": "+5511999999999",
        "customerTaxId": "12345678901",
        "products": [
          {
            "id": "prod_123",
            "name": "Curso Premium",
            "price": 99.90
          }
        ],
        "paymentMethod": "credit_card",
        "transactionId": "txn_abc123",
        "devMode": false,
        "createdAt": "2024-01-15T11:00:00.000Z",
        "updatedAt": "2024-01-15T11:00:00.000Z",
        "customer": {
          "id": "clx1234567890abcdef",
          "name": "João Silva",
          "email": "usuario@exemplo.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### POST `/v1/customers/:id/purchases`
**Descrição**: Cria uma nova compra para um cliente (apenas Admin)
**Autenticação**: ✅ Admin

**Payload de Entrada**:
```json
{
  "amount": 99.90,
  "paymentAmount": 99.90,
  "event": "payment.completed",
  "status": "completed",
  "customerName": "João Silva",
  "customerEmail": "usuario@exemplo.com",
  "customerPhone": "+5511999999999",
  "customerTaxId": "12345678901",
  "products": [
    {
      "id": "prod_123",
      "name": "Curso Premium",
      "price": 99.90
    }
  ],
  "paymentMethod": "credit_card",
  "transactionId": "txn_abc123",
  "webhookData": {
    "provider": "abacatepay",
    "originalData": {}
  },
  "devMode": false
}
```

**Resposta de Sucesso (201)**:
```json
{
  "success": true,
  "message": "Purchase created successfully",
  "data": {
    "id": "clx9876543210fedcba",
    "customerId": "clx1234567890abcdef",
    "amount": 99.90,
    "paymentAmount": 99.90,
    "event": "payment.completed",
    "status": "completed",
    "customerName": "João Silva",
    "customerEmail": "usuario@exemplo.com",
    "customerPhone": "+5511999999999",
    "customerTaxId": "12345678901",
    "products": [
      {
        "id": "prod_123",
        "name": "Curso Premium",
        "price": 99.90
      }
    ],
    "paymentMethod": "credit_card",
    "transactionId": "txn_abc123",
    "webhookData": {
      "provider": "abacatepay",
      "originalData": {}
    },
    "devMode": false,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z",
    "customer": {
      "id": "clx1234567890abcdef",
      "name": "João Silva",
      "email": "usuario@exemplo.com"
    }
  }
}
```

---

### DELETE `/v1/customers/:id/purchases/:purchaseId`
**Descrição**: Remove uma compra (apenas Admin)
**Autenticação**: ✅ Admin

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Purchase deleted successfully"
}
```

---

## 📁 Categorias

### GET `/v1/categories`
**Descrição**: Lista todas as categorias

**Query Parameters**:
- `page` (string, opcional): Número da página (padrão: 1)
- `limit` (string, opcional): Itens por página (padrão: 10)
- `isActive` (string, opcional): Filtrar por status ativo

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "clxcat1234567890abcdef",
      "name": "Desenvolvimento Web",
      "description": "Cursos sobre desenvolvimento web moderno",
      "slug": "desenvolvimento-web",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET `/v1/categories/:id`
**Descrição**: Busca uma categoria específica por ID

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "id": "clxcat1234567890abcdef",
    "name": "Desenvolvimento Web",
    "description": "Cursos sobre desenvolvimento web moderno",
    "slug": "desenvolvimento-web",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "videos": [
      {
        "id": "clxvid1234567890abcdef",
        "title": "Introdução ao React",
        "description": "Aprenda os fundamentos do React",
        "thumbnail": "https://exemplo.com/thumb.jpg",
        "duration": 1800
      }
    ]
  }
}
```

---

### GET `/v1/categories/slug/:slug`
**Descrição**: Busca uma categoria por slug

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": "desenvolvimento-web"
}
```

---

## 🎥 Vídeos

### GET `/v1/categories/:id/videos`
**Descrição**: Lista vídeos de uma categoria

**Query Parameters**:
- `isPublished` (string, opcional): Filtrar apenas vídeos publicados
- `page` (string, opcional): Número da página
- `limit` (string, opcional): Itens por página

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Videos retrieved successfully",
  "data": {
    "category": {
      "id": "clxcat1234567890abcdef",
      "name": "Desenvolvimento Web",
      "description": "Cursos sobre desenvolvimento web moderno",
      "slug": "desenvolvimento-web"
    },
    "videos": [
      {
        "id": "clxvid1234567890abcdef",
        "title": "Introdução ao React",
        "description": "Aprenda os fundamentos do React",
        "url": "https://exemplo.com/video.mp4",
        "thumbnail": "https://exemplo.com/thumb.jpg",
        "duration": 1800,
        "isPublished": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### GET `/v1/categories/:id/video/:videoId`
**Descrição**: Busca um vídeo específico de uma categoria

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Video retrieved successfully",
  "data": {
    "category": {
      "id": "clxcat1234567890abcdef",
      "name": "Desenvolvimento Web",
      "slug": "desenvolvimento-web"
    },
    "video": {
      "id": "clxvid1234567890abcdef",
      "title": "Introdução ao React",
      "description": "Aprenda os fundamentos do React",
      "url": "https://exemplo.com/video.mp4",
      "thumbnail": "https://exemplo.com/thumb.jpg",
      "duration": 1800,
      "isPublished": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### POST `/v1/categories/:id/video`
**Descrição**: Cria um novo vídeo em uma categoria

**Payload de Entrada**:
```json
{
  "title": "Introdução ao React",
  "description": "Aprenda os fundamentos do React",
  "url": "https://exemplo.com/video.mp4",
  "thumbnail": "https://exemplo.com/thumb.jpg",
  "duration": 1800,
  "isPublished": false
}
```

**Resposta de Sucesso (201)**:
```json
{
  "success": true,
  "message": "Video created successfully",
  "data": {
    "category": {
      "id": "clxcat1234567890abcdef",
      "name": "Desenvolvimento Web"
    },
    "video": {
      "id": "clxvid1234567890abcdef",
      "title": "Introdução ao React",
      "description": "Aprenda os fundamentos do React",
      "url": "https://exemplo.com/video.mp4",
      "thumbnail": "https://exemplo.com/thumb.jpg",
      "duration": 1800,
      "isPublished": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### PUT `/v1/categories/:id/video/:videoId`
**Descrição**: Atualiza um vídeo

**Payload de Entrada**:
```json
{
  "title": "Introdução ao React - Atualizado",
  "description": "Aprenda os fundamentos do React com exemplos práticos",
  "url": "https://exemplo.com/video-atualizado.mp4",
  "thumbnail": "https://exemplo.com/thumb-nova.jpg",
  "duration": 2000,
  "isPublished": true
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Video updated successfully",
  "data": {
    "category": {
      "id": "clxcat1234567890abcdef",
      "name": "Desenvolvimento Web"
    },
    "video": {
      "id": "clxvid1234567890abcdef",
      "title": "Introdução ao React - Atualizado",
      "description": "Aprenda os fundamentos do React com exemplos práticos",
      "url": "https://exemplo.com/video-atualizado.mp4",
      "thumbnail": "https://exemplo.com/thumb-nova.jpg",
      "duration": 2000,
      "isPublished": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

---

### DELETE `/v1/categories/:id/video/:videoId`
**Descrição**: Remove um vídeo (soft delete)

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Video deleted successfully",
  "data": {
    "category": {
      "id": "clxcat1234567890abcdef",
      "name": "Desenvolvimento Web"
    }
  }
}
```

---

## 🔗 Webhooks

### POST `/webhook/abacatepay`
**Descrição**: Webhook para receber notificações do AbacatePay

**Payload de Entrada** (exemplo do AbacatePay):
```json
{
  "data": {
    "billing": {
      "customer": {
        "metadata": {
          "email": "usuario@exemplo.com",
          "name": "João Silva"
        }
      },
      "products": [
        {
          "id": "prod_123",
          "name": "Curso Premium",
          "price": 99.90
        }
      ],
      "purchase": {
        "id": "purchase_abc123",
        "amount": 99.90,
        "status": "completed"
      }
    }
  }
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "success": true,
    "message": "Webhook processed successfully"
  }
}
```

---

### GET `/webhook/abacatepay`
**Descrição**: Endpoint GET para webhook (não suportado)

**Resposta de Erro (405)**:
```json
{
  "success": false,
  "message": "GET method not supported for webhook"
}
```

---

## 🏥 Health Check

### GET `/health`
**Descrição**: Verifica o status da aplicação e conexão com o banco

**Resposta de Sucesso (200)**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Resposta de Erro (503)**:
```json
{
  "status": "error",
  "message": "Database connection failed"
}
```

---

## 📊 Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 204 | Sucesso sem conteúdo |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Proibido |
| 404 | Não encontrado |
| 405 | Método não permitido |
| 409 | Conflito (recurso já existe) |
| 500 | Erro interno do servidor |
| 503 | Serviço indisponível |

---

## 🔒 Níveis de Acesso

### 👤 Usuário Comum
- ✅ Login/Logout
- ✅ Visualizar próprias compras
- ✅ Visualizar categorias e vídeos

### 👨‍💼 Admin
- ✅ Todas as funcionalidades do usuário
- ✅ Gerenciar clientes
- ✅ Gerenciar compras
- ✅ Reset de senhas
- ✅ Acesso total à API

---

## 🛠️ Estrutura de Dados

### Customer (Cliente)
```typescript
{
  id: string;                    // ID único (CUID)
  email: string;                 // Email único
  name: string;                  // Nome do cliente
  password: string;              // Senha (hash)
  role: 'FREE' | 'MEMBER' | 'ADMIN';
  isActive: boolean;             // Status ativo
  resetPasswordToken?: string;   // Token para reset
  resetPasswordExpires?: Date;   // Expiração do token
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data de atualização
  deactivatedAt?: Date;          // Data de desativação
}
```

### Category (Categoria)
```typescript
{
  id: string;                    // ID único (CUID)
  name: string;                  // Nome da categoria
  description?: string;          // Descrição
  slug: string;                  // Slug único
  isActive: boolean;             // Status ativo
  sortOrder: number;             // Ordem de exibição
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data de atualização
  deactivatedAt?: Date;          // Data de desativação
}
```

### Video (Vídeo)
```typescript
{
  id: string;                    // ID único (CUID)
  title: string;                 // Título do vídeo
  description?: string;          // Descrição
  url: string;                   // URL do vídeo
  thumbnail?: string;            // URL da thumbnail
  duration?: number;             // Duração em segundos
  isPublished: boolean;          // Status de publicação
  categoryId?: string;           // ID da categoria
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data de atualização
  deactivatedAt?: Date;          // Data de desativação
}
```

### Purchase (Compra)
```typescript
{
  id: string;                    // ID único (CUID)
  customerId: string;            // ID do cliente
  amount: number;                // Valor da compra
  paymentAmount: number;         // Valor pago
  event: string;                 // Evento do webhook
  status: string;                // Status da compra
  customerName: string;          // Nome do cliente
  customerEmail: string;         // Email do cliente
  customerPhone?: string;        // Telefone do cliente
  customerTaxId?: string;        // CPF/CNPJ do cliente
  products?: any;                // Produtos (JSON)
  webhookData?: any;             // Dados do webhook (JSON)
  paymentMethod?: string;        // Método de pagamento
  transactionId?: string;        // ID da transação
  devMode: boolean;              // Modo desenvolvimento
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data de atualização
  deactivatedAt?: Date;          // Data de desativação
}
```

---

## 🚀 Como Usar

### 1. Autenticação
```bash
# Registrar usuário
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123",
    "name": "João Silva"
  }'

# Fazer login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### 2. Usar Token
```bash
# Exemplo com token
curl -X GET http://localhost:3000/v1/customers/purchases \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Documentação Interativa
Acesse `http://localhost:3000/docs` para uma interface Swagger interativa onde você pode testar todas as rotas diretamente no navegador.

---

## 📝 Notas Importantes

1. **Soft Delete**: Todos os recursos usam soft delete (campo `deactivatedAt`)
2. **Paginação**: Endpoints de listagem suportam paginação via query parameters
3. **Validação**: Todos os inputs são validados usando Zod schemas
4. **Sanitização**: Respostas são sanitizadas para remover dados sensíveis
5. **Logs**: Sistema de logging completo com diferentes níveis
6. **CORS**: Configurado para aceitar requisições de qualquer origem
7. **Rate Limiting**: Implementado para prevenir abuso
8. **Webhooks**: Suporte completo para webhooks do AbacatePay

---

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente Necessárias
```env
DATABASE_URL="postgresql://user:password@localhost:5432/noteplanning"
JWT_SECRET="seu_jwt_secret_aqui"
NODE_ENV="development"
PORT=3000
HOST="0.0.0.0"
LOG_LEVEL="info"
MAX_FILE_SIZE=10485760
```

### Comandos Úteis
```bash
# Instalar dependências
npm install

# Executar migrações
npx prisma migrate dev

# Popular banco com dados de teste
npx prisma db seed

# Iniciar servidor de desenvolvimento
npm run dev

# Executar testes
npm test

# Build para produção
npm run build
```

---

**📞 Suporte**: Para dúvidas ou problemas, consulte a documentação Swagger em `/docs` ou entre em contato com a equipe de desenvolvimento.

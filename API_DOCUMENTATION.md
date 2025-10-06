# API Documentation - NotePlanning Backend

## Base URL
```
Production: https://noteplanning-backend.fly.dev
Development: http://localhost:3000
```

## Authentication
A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header `Authorization`:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format
Todas as respostas seguem o formato padrão:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "total": 10 // (opcional, para listagens)
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message" // (opcional)
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔐 Authentication Endpoints

### POST /customers/register
Registrar novo usuário

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "CUSTOMER",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### POST /customers/login
Fazer login

**Request Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "role": "CUSTOMER"
    }
  }
}
```

---

## 👥 Customer Endpoints

### GET /customers
Listar todos os clientes (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "email": "joao@email.com",
      "name": "João Silva",
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### GET /customers/:id
Obter cliente por ID (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Customer found",
  "data": {
    "id": "uuid",
    "email": "joao@email.com",
    "name": "João Silva",
    "role": "CUSTOMER",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "memberships": [
      {
        "id": "uuid",
        "startDate": "2025-01-01T00:00:00.000Z",
        "endDate": "2025-02-01T00:00:00.000Z",
        "isActive": true,
        "planType": "monthly"
      }
    ],
    "videos": [
      {
        "id": "uuid",
        "title": "Video Title",
        "description": "Video description",
        "url": "https://example.com/video.mp4",
        "thumbnail": "https://example.com/thumb.jpg",
        "duration": 300,
        "isPublished": true,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### GET /customers/stats
Obter estatísticas dos clientes (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Customer statistics retrieved successfully",
  "data": {
    "totalCustomers": 100,
    "activeCustomers": 85,
    "newCustomersThisMonth": 15,
    "customersWithMemberships": 60
  }
}
```

---

## 📂 Category Endpoints

### GET /categories
Listar todas as categorias

**Query Parameters:**
- `includeVideos` (string, default: "true") - Incluir vídeos na resposta
- `isActive` (string, default: "true") - Filtrar apenas categorias ativas

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Planejamento Pessoal",
      "description": "Vídeos sobre organização pessoal e produtividade",
      "slug": "planejamento-pessoal",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "videos": [
        {
          "id": "uuid",
          "title": "Como Organizar sua Rotina",
          "description": "Aprenda a criar uma rotina eficaz",
          "cardImageUrl": "https://example.com/image.jpg",
          "duration": 900,
          "likes": 25,
          "createdAt": "2025-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "total": 1
}
```

### GET /categories/:id
Obter categoria por ID ou slug

**Response:**
```json
{
  "success": true,
  "message": "Category found",
  "data": {
    "id": "uuid",
    "name": "Planejamento Pessoal",
    "description": "Vídeos sobre organização pessoal e produtividade",
    "slug": "planejamento-pessoal",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "videos": [
      {
        "id": "uuid",
        "title": "Como Organizar sua Rotina",
        "description": "Aprenda a criar uma rotina eficaz",
        "videoURL": "https://youtube.com/watch?v=example",
        "cardImageUrl": "https://example.com/image.jpg",
        "duration": 900,
        "likes": 25,
        "requiredProducts": ["template-basico"],
        "createdAt": "2025-01-01T00:00:00.000Z",
        "customer": {
          "id": "uuid",
          "name": "João Silva",
          "email": "joao@email.com"
        }
      }
    ]
  }
}
```

### POST /categories
Criar nova categoria (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "Nova Categoria",
  "description": "Descrição da categoria",
  "slug": "nova-categoria",
  "sortOrder": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "uuid",
    "name": "Nova Categoria",
    "description": "Descrição da categoria",
    "slug": "nova-categoria",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "videos": []
  }
}
```

### PUT /categories/:id
Atualizar categoria (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:** (mesmo formato do POST, todos os campos opcionais)

**Response:** (mesmo formato do POST)

### DELETE /categories/:id
Deletar categoria (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## 🎥 Video Endpoints

### GET /videos/published
Listar vídeos publicados (Público)

**Query Parameters:**
- `page` (string, default: "1")
- `limit` (string, default: "10")
- `search` (string, opcional)
- `customerId` (string, opcional)
- `minDuration` (string, opcional)
- `maxDuration` (string, opcional)

**Example:** `GET /videos/published?page=1&limit=5&search=tutorial`

**Response:**
```json
{
  "success": true,
  "message": "Published videos retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Tutorial de Planejamento",
      "description": "Aprenda a planejar seu dia",
      "url": "https://example.com/video.mp4",
      "thumbnail": "https://example.com/thumb.jpg",
      "duration": 300,
      "isPublished": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "customer": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@email.com"
      }
    }
  ],
  "total": 1
}
```

### GET /videos/:id
Obter vídeo por ID (Público)

**Response:**
```json
{
  "success": true,
  "message": "Video found",
  "data": {
    "id": "uuid",
    "title": "Tutorial de Planejamento",
    "description": "Aprenda a planejar seu dia",
    "url": "https://example.com/video.mp4",
    "thumbnail": "https://example.com/thumb.jpg",
    "duration": 300,
    "isPublished": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "customer": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com"
    }
  }
}
```

### GET /videos
Listar todos os vídeos (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:** (mesmos do endpoint published)

**Response:** (mesmo formato do endpoint published)

### POST /videos
Criar novo vídeo (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "title": "Novo Tutorial",
  "description": "Descrição do tutorial",
  "url": "https://example.com/video.mp4",
  "thumbnail": "https://example.com/thumb.jpg",
  "duration": 300,
  "isPublished": false,
  "customerId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video created successfully",
  "data": {
    "id": "uuid",
    "title": "Novo Tutorial",
    "description": "Descrição do tutorial",
    "url": "https://example.com/video.mp4",
    "thumbnail": "https://example.com/thumb.jpg",
    "duration": 300,
    "isPublished": false,
    "customerId": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "customer": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com"
    }
  }
}
```

### PUT /videos/:id
Atualizar vídeo (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:** (mesmo formato do POST, todos os campos opcionais)

**Response:** (mesmo formato do POST)

### DELETE /videos/:id
Deletar vídeo (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

### GET /videos/category/:categoryId
Obter vídeos por categoria

**Query Parameters:**
- `page` (string, default: "1")
- `limit` (string, default: "10")
- `search` (string, opcional)
- `customerId` (string, opcional)
- `minDuration` (string, opcional)
- `maxDuration` (string, opcional)

**Response:**
```json
{
  "success": true,
  "message": "Category videos retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Tutorial de Planejamento",
      "description": "Aprenda a planejar seu dia",
      "videoURL": "https://youtube.com/watch?v=example",
      "cardImageUrl": "https://example.com/thumb.jpg",
      "duration": 300,
      "likes": 15,
      "isPublished": true,
      "requiredProducts": ["template-basico"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "category": {
        "id": "uuid",
        "name": "Planejamento Pessoal",
        "slug": "planejamento-pessoal"
      },
      "customer": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@email.com"
      }
    }
  ],
  "total": 1
}
```

### PATCH /videos/:id/like
Curtir/descurtir vídeo

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "liked": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video like status updated successfully",
  "data": {
    "id": "uuid",
    "title": "Tutorial de Planejamento",
    "likes": 16,
    "isPublished": true
  }
}
```

### GET /videos/search
Buscar vídeos

**Query Parameters:**
- `q` (string, obrigatório) - Termo de busca
- `page` (string, default: "1")
- `limit` (string, default: "10")
- `categoryId` (string, opcional)
- `customerId` (string, opcional)
- `minDuration` (string, opcional)
- `maxDuration` (string, opcional)

**Example:** `GET /videos/search?q=tutorial&categoryId=uuid&limit=5`

**Response:**
```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Tutorial de Planejamento",
      "description": "Aprenda a planejar seu dia",
      "videoURL": "https://youtube.com/watch?v=example",
      "cardImageUrl": "https://example.com/thumb.jpg",
      "duration": 300,
      "likes": 15,
      "isPublished": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "category": {
        "id": "uuid",
        "name": "Planejamento Pessoal",
        "slug": "planejamento-pessoal"
      },
      "customer": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@email.com"
      }
    }
  ],
  "total": 1
}
```

### GET /videos/trending
Obter vídeos em alta (mais curtidos)

**Query Parameters:**
- `page` (string, default: "1")
- `limit` (string, default: "10")
- `categoryId` (string, opcional)
- `customerId` (string, opcional)
- `minDuration` (string, opcional)
- `maxDuration` (string, opcional)

**Response:**
```json
{
  "success": true,
  "message": "Trending videos retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Vídeo Mais Popular",
      "description": "Este é o vídeo mais curtido",
      "videoURL": "https://youtube.com/watch?v=example",
      "cardImageUrl": "https://example.com/thumb.jpg",
      "duration": 300,
      "likes": 150,
      "isPublished": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "category": {
        "id": "uuid",
        "name": "Planejamento Pessoal",
        "slug": "planejamento-pessoal"
      },
      "customer": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@email.com"
      }
    }
  ],
  "total": 1
}
```

---

## 🎫 Membership Endpoints

### GET /memberships
Listar todas as assinaturas

**Response:**
```json
{
  "success": true,
  "message": "Memberships retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-02-01T00:00:00.000Z",
      "isActive": true,
      "planType": "monthly",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "customer": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@email.com",
        "role": "CUSTOMER"
      }
    }
  ],
  "total": 1
}
```

### GET /memberships/:id
Obter assinatura por ID

**Response:**
```json
{
  "success": true,
  "message": "Membership found",
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-02-01T00:00:00.000Z",
    "isActive": true,
    "planType": "monthly",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "customer": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "role": "CUSTOMER"
    }
  }
}
```

### GET /memberships/customer/:customerId
Obter assinaturas de um cliente

**Response:**
```json
{
  "success": true,
  "message": "Customer memberships retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-02-01T00:00:00.000Z",
      "isActive": true,
      "planType": "monthly",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### POST /memberships
Criar nova assinatura

**Request Body:**
```json
{
  "customerId": "uuid",
  "startDate": "2025-01-01T00:00:00.000Z", // opcional, padrão: agora
  "endDate": "2025-02-01T00:00:00.000Z",
  "planType": "monthly" // opcional, padrão: "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Membership created successfully",
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-02-01T00:00:00.000Z",
    "isActive": true,
    "planType": "monthly",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### DELETE /memberships/:id
Deletar assinatura (soft delete)

**Response:**
```json
{
  "success": true,
  "message": "Membership deleted successfully"
}
```

---

## 💳 Purchase Endpoints

### GET /purchases
Listar todas as compras (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string, enum: "completed", "pending", "failed", "refunded")
- `customerId` (string)
- `customerEmail` (string)
- `startDate` (string, ISO date)
- `endDate` (string, ISO date)

**Response:**
```json
{
  "success": true,
  "message": "Purchases retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "amount": 29.90,
      "status": "completed",
      "paymentMethod": "credit_card",
      "transactionId": "tx_123456",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "customer": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@email.com"
      }
    }
  ],
  "total": 1,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### GET /purchases/:id
Obter compra por ID (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Purchase found",
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "amount": 29.90,
    "status": "completed",
    "paymentMethod": "credit_card",
    "transactionId": "tx_123456",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "customer": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com"
    }
  }
}
```

### GET /purchases/my-purchases
Obter minhas compras (Customer + Admin)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "User purchases retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "amount": 29.90,
      "status": "completed",
      "paymentMethod": "credit_card",
      "transactionId": "tx_123456",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### GET /purchases/customer/:customerId/stats
Obter estatísticas de compras de um cliente (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Customer purchase statistics retrieved successfully",
  "data": {
    "totalPurchases": 5,
    "totalAmount": 149.50,
    "completedPurchases": 4,
    "pendingPurchases": 1,
    "averagePurchaseValue": 29.90
  }
}
```

### GET /purchases/customer/:customerId/video-access
Verificar se cliente tem acesso a vídeos (Admin only)

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "Video access status retrieved successfully",
  "data": {
    "hasAccess": true,
    "accessReason": "Has completed purchase with video access",
    "lastPurchaseDate": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 🔗 Webhook Endpoints

### POST /webhook/abacatepay
Webhook do AbacatePay para notificações de pagamento

**Request Body:** (formato específico do AbacatePay)

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### GET /webhook/abacatepay
Método não suportado

**Response:**
```json
{
  "success": false,
  "message": "Method not allowed"
}
```

---

## 🏥 Health & Utility Endpoints

### GET /health
Health check da aplicação

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600.123,
  "environment": "production"
}
```

### GET /docs
Documentação Swagger da API (apenas em desenvolvimento)

---

## 🔑 User Roles

- **CUSTOMER**: Usuário comum
- **MEMBER**: Usuário com assinatura ativa
- **ADMIN**: Administrador do sistema

---

## 📝 Notes

1. **Autenticação**: Todos os endpoints marcados como "Admin only" requerem token de administrador
2. **Paginação**: Endpoints de listagem suportam paginação via query parameters
3. **Soft Delete**: Deletar recursos faz soft delete (marca como inativo)
4. **Timezone**: Todas as datas são em UTC
5. **Rate Limiting**: Aplicado em produção
6. **CORS**: Configurado para permitir requisições do frontend

---

## 🚀 Quick Start Examples

### 1. Registrar e fazer login
```javascript
// Registrar
const registerResponse = await fetch('/customers/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'João Silva',
    email: 'joao@email.com',
    password: 'senha123'
  })
});

// Login
const loginResponse = await fetch('/customers/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'joao@email.com',
    password: 'senha123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;
```

### 2. Listar vídeos publicados
```javascript
const videosResponse = await fetch('/videos/published?page=1&limit=10');
const videos = await videosResponse.json();
```

### 3. Verificar minhas compras
```javascript
const purchasesResponse = await fetch('/purchases/my-purchases', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const purchases = await purchasesResponse.json();
```

### 4. Criar assinatura (Admin)
```javascript
const membershipResponse = await fetch('/memberships', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    customerId: 'uuid',
    endDate: '2025-02-01T00:00:00.000Z',
    planType: 'monthly'
  })
});
```

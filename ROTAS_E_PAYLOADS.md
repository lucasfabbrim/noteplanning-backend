# 📋 **TODAS AS ROTAS E PAYLOADS**

## 🔐 **AUTENTICAÇÃO** (`/v1/auth`)

### **POST /v1/auth/login**
**Payload:**
```json
{
  "email": "string (email format)",
  "password": "string (min 6 chars)"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token"
  }
}
```

### **POST /v1/auth/register**
**Payload:**
```json
{
  "email": "string (email format)",
  "password": "string (min 6 chars)",
  "name": "string (min 2 chars)"
}
```

### **POST /v1/auth/logout**
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👥 **CUSTOMERS** (`/v1/customers`)

### **GET /v1/customers** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": [
    {
      "email": "string",
      "name": "string",
      "role": "ADMIN|FREE|MEMBER",
      "isActive": true,
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "total": 5
}
```

### **GET /v1/customers/:id** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "message": "Customer found",
  "data": {
    "email": "string",
    "name": "string",
    "role": "string",
    "isActive": true,
    "createdAt": "ISO date",
    "updatedAt": "ISO date",
    "purchases": [...]
  }
}
```

### **GET /v1/customers/email/:email** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "message": "Customer found",
  "data": {
    "email": "string",
    "name": "string",
    "role": "string",
    "isActive": true,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

### **PUT /v1/customers/:id** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Payload:**
```json
{
  "email": "string (email format)",
  "name": "string (2-100 chars)",
  "password": "string (6-100 chars)"
}
```

### **DELETE /v1/customers/:id** (Admin only)
**Headers:** `Authorization: Bearer {token}`

### **POST /v1/customers/forgot-password** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Payload:**
```json
{
  "email": "string (email format)"
}
```

### **POST /v1/customers/reset-password** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Payload:**
```json
{
  "token": "string",
  "newPassword": "string (min 6 chars)"
}
```

---

## 🛒 **PURCHASES** (`/v1/customers`)

### **GET /v1/customers/purchases** (Authenticated)
**Headers:** `Authorization: Bearer {token}`
**Query params:** `?page=1&limit=10&status=completed`
**Response:**
```json
{
  "success": true,
  "message": "Your purchases retrieved successfully",
  "data": [
    {
      "amount": 100,
      "paymentAmount": 100,
      "event": "payment.completed",
      "status": "completed",
      "customerName": "string",
      "customerEmail": "string",
      "createdAt": "ISO date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### **GET /v1/customers/:id/purchases** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Query params:** `?page=1&limit=10&status=completed`

### **POST /v1/customers/:id/purchases** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Payload:**
```json
{
  "amount": 100,
  "paymentAmount": 100,
  "event": "payment.completed",
  "status": "completed",
  "customerName": "string",
  "customerEmail": "string (email format)",
  "customerPhone": "string",
  "customerTaxId": "string",
  "products": [],
  "paymentMethod": "manual",
  "transactionId": "string",
  "webhookData": {},
  "devMode": false
}
```

### **DELETE /v1/customers/:id/purchases/:purchaseId** (Admin only)
**Headers:** `Authorization: Bearer {token}`

---

## 📂 **CATEGORIES** (`/v1/categories`)

### **GET /v1/categories**
**Query params:** `?page=1&limit=10&isActive=true`
**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "name": "string",
      "description": "string",
      "slug": "string",
      "isActive": true,
      "sortOrder": 1,
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

### **GET /v1/categories/:id**
**Response:**
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "name": "string",
    "description": "string",
    "slug": "string",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "ISO date",
    "updatedAt": "ISO date",
    "videos": [...]
  }
}
```

### **GET /v1/categories/slug/:slug**
**Response:**
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": "slug_string"
}
```

---

## 🎥 **VIDEOS BY CATEGORY** (`/v1/categories`)

### **GET /v1/categories/:slug/videos**
**Query params:** `?isPublished=true&page=1&limit=10`
**Response:**
```json
{
  "success": true,
  "message": "Videos retrieved successfully",
  "data": {
    "category": {
      "name": "string",
      "description": "string",
      "slug": "string"
    },
    "videos": [
      {
        "title": "string",
        "description": "string",
        "url": "string",
        "thumbnail": "string",
        "duration": 120,
        "isPublished": true,
        "createdAt": "ISO date",
        "updatedAt": "ISO date"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### **GET /v1/categories/:slug/video/:videoSlug**
**Response:**
```json
{
  "success": true,
  "message": "Video retrieved successfully",
  "data": {
    "category": {
      "name": "string",
      "slug": "string"
    },
    "video": {
      "title": "string",
      "description": "string",
      "url": "string",
      "thumbnail": "string",
      "duration": 120,
      "isPublished": true,
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  }
}
```

### **POST /v1/categories/:slug/video**
**Payload:**
```json
{
  "title": "string",
  "slug": "string",
  "description": "string",
  "url": "string",
  "thumbnail": "string",
  "duration": 120,
  "isPublished": false
}
```

### **PUT /v1/categories/:slug/video/:videoSlug**
**Payload:**
```json
{
  "title": "string",
  "slug": "string",
  "description": "string",
  "url": "string",
  "thumbnail": "string",
  "duration": 120,
  "isPublished": true
}
```

### **DELETE /v1/categories/:slug/video/:videoSlug**

---

## 📦 **PRODUCTS** (`/v1/products`)

### **GET /v1/products** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Query params:** `?page=1&limit=10&isActive=true&categoryId=xxx`
**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "string",
      "externalId": "string",
      "name": "string",
      "description": "string",
      "price": 99.99,
      "isActive": true,
      "categoryId": "string",
      "createdAt": "ISO date",
      "updatedAt": "ISO date",
      "category": {
        "id": "string",
        "name": "string",
        "slug": "string"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### **GET /v1/products/:id** (Admin only)
**Headers:** `Authorization: Bearer {token}`

### **GET /v1/products/external/:externalId** (Admin only)
**Headers:** `Authorization: Bearer {token}`

### **POST /v1/products** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Payload:**
```json
{
  "externalId": "string",
  "name": "string",
  "description": "string",
  "price": 99.99,
  "categoryId": "string",
  "isActive": true
}
```

### **PUT /v1/products/:id** (Admin only)
**Headers:** `Authorization: Bearer {token}`
**Payload:**
```json
{
  "name": "string",
  "description": "string",
  "price": 99.99,
  "categoryId": "string",
  "isActive": true
}
```

### **DELETE /v1/products/:id** (Admin only)
**Headers:** `Authorization: Bearer {token}`

---

## 🔗 **WEBHOOKS** (`/webhook`)

### **GET /webhook/abacatepay**
**Response:** Status check

### **POST /webhook/abacatepay**
**Payload:** AbacatePay webhook data

---

## 🏥 **HEALTH CHECK**

### **GET /health**
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T05:06:03.614Z"
}
```

---

## 📚 **DOCUMENTATION**

### **GET /docs**
**Response:** Swagger UI HTML

---

## 🔑 **AUTENTICAÇÃO**

- **Bearer Token:** Adicione `Authorization: Bearer {token}` no header
- **Admin Routes:** Requer role `ADMIN`
- **Authenticated Routes:** Requer token válido
- **Public Routes:** Não requer autenticação

## 📝 **NOTAS IMPORTANTES**

1. **IDs removidos:** Todas as respostas têm IDs removidos por segurança
2. **Paginação:** Use `page` e `limit` para paginar resultados
3. **Soft Delete:** DELETE não remove permanentemente, marca como `deactivatedAt`
4. **Sanitização:** Senhas e IDs sensíveis são removidos das respostas
5. **CORS:** Configurado para aceitar todas as origens

## 🌐 **URLs BASE**

- **Desenvolvimento:** `http://localhost:3000`
- **Produção:** `https://noteplanning-backend.fly.dev`

## 🎯 **EXEMPLOS DE USO**

### Login
```bash
curl -X POST https://noteplanning-backend.fly.dev/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@noteplanning.com", "password": "admin123"}'
```

### Listar Categorias
```bash
curl -X GET https://noteplanning-backend.fly.dev/v1/categories
```

### Obter Vídeos de uma Categoria
```bash
curl -X GET https://noteplanning-backend.fly.dev/v1/categories/programming-basics/videos
```

### Obter Vídeo Específico
```bash
curl -X GET https://noteplanning-backend.fly.dev/v1/categories/programming-basics/video/introduction-to-nodejs
```

### Acessar Documentação
```bash
# Abrir no navegador
https://noteplanning-backend.fly.dev/docs
```

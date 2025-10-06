# AbacatePay Webhook Integration

Este documento descreve como usar a integração com webhooks do AbacatePay para criar automaticamente registros de Customer no banco de dados.

## Configuração

### Variáveis de Ambiente

Adicione as seguintes variáveis no seu arquivo `.env`:

```env
ABACATEPAY_TOKEN_SECRET="seu-token-secreto-do-abacatepay"
DATABASE_URL="postgresql://user:password@localhost:5432/noteplanning?schema=public"
```

## Endpoint

### POST /webhook/abacatepay

Recebe webhooks do gateway AbacatePay e cria automaticamente um Customer no banco de dados.

**URL:** `http://your-domain.com/webhook/abacatepay`

**Método:** `POST`

**Query Parameters:**
- `webhookSecret` (obrigatório): Token secreto para validação do webhook

**Headers:**
```
Content-Type: application/json
```

**Body Example:**
```json
{
  "data": {
    "billing": {
      "customer": {
        "metadata": {
          "name": "João Silva",
          "email": "joao.silva@example.com",
          "cellphone": "11999999999",
          "taxId": "12345678900"
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
      "name": "Curso de Node.js",
      "quantity": 1,
      "price": 99.90
    }
  ],
  "event": "payment.completed",
  "devMode": false
}
```

## Respostas

### 201 Created - Customer criado com sucesso

```json
{
  "success": true,
  "message": "Customer criado com sucesso",
  "data": {
    "id": "cm123abc456",
    "name": "João Silva",
    "email": "joao.silva@example.com",
    "role": "FREE",
    "createdAt": "2025-10-06T03:47:05.361Z"
  }
}
```

### 400 Bad Request - Validação falhou

```json
{
  "success": false,
  "message": "Invalid webhook body",
  "errors": [
    {
      "field": "data.billing.customer.metadata.email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized - Secret inválido

```json
{
  "success": false,
  "message": "Unauthorized - Invalid webhook secret"
}
```

### 409 Conflict - Customer já existe

```json
{
  "success": false,
  "message": "Customer with this email already exists"
}
```

### 405 Method Not Allowed - Método GET não suportado

```json
{
  "success": false,
  "message": "Method GET not supported. Use POST."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

## Eventos Suportados

A integração processa os seguintes eventos:

### Eventos que criam Customer:
- `payment.completed` - Pagamento completado com sucesso
- `sale.completed` - Venda completada com sucesso
- `payment.approved` - Pagamento aprovado

### Eventos que são recebidos mas não geram ação:
- `payment.pending` - Pagamento pendente
- `payment.failed` - Pagamento falhou

## Validações

O webhook valida os seguintes campos obrigatórios:

- `data.billing.customer.metadata.name` (string, mínimo 1 caractere)
- `data.billing.customer.metadata.email` (string, formato email válido)
- `data.billing.customer.metadata.cellphone` (string, mínimo 1 caractere)
- `data.billing.amount` (number, positivo)
- `data.payment.amount` (number, positivo)
- `event` (string, mínimo 1 caractere)

Campos opcionais:
- `data.billing.customer.metadata.taxId` (string)
- `products` (array de objetos)
- `devMode` (boolean, default: false)

## Comportamento com Customers Existentes

### Customer Ativo
Se um customer com o mesmo email já existir e estiver ativo (`deactivatedAt: null`), o webhook retornará erro 409 Conflict.

### Customer Desativado
Se um customer com o mesmo email existir mas estiver desativado (`deactivatedAt: <data>`), o webhook irá **reativar** o customer existente ao invés de criar um novo, atualizando:
- `name` com o novo valor
- `deactivatedAt` para `null`
- `isActive` para `true`
- `updatedAt` para a data atual

## Modo Dev

Quando `devMode: true`, os logs do webhook serão prefixados com `[DEV]` para facilitar a depuração durante o desenvolvimento.

## Testes

### Teste Manual com cURL

```bash
# Teste com webhook válido
curl -X POST "http://localhost:3000/webhook/abacatepay?webhookSecret=test-secret-token-for-abacatepay" \
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
    "event": "payment.completed",
    "devMode": true
  }'

# Teste com secret inválido (deve retornar 401)
curl -X POST "http://localhost:3000/webhook/abacatepay?webhookSecret=wrong-secret" \
  -H "Content-Type: application/json" \
  -d '{}'

# Teste com método GET (deve retornar 405)
curl -X GET "http://localhost:3000/webhook/abacatepay"
```

### Testes Automatizados

Execute os testes automatizados com:

```bash
npm test
```

Os testes cobrem:
- ✅ Criação correta de customer
- ✅ Validação de secret inválido
- ✅ Validação de email duplicado
- ✅ Reativação de customer desativado
- ✅ Validação do body com Zod
- ✅ Diferentes tipos de eventos

## Logs

Todos os webhooks recebidos são logados com as seguintes informações:

```
[INFO] Webhook received from AbacatePay
  event: "payment.completed"
  devMode: true
  email: "customer@example.com"
  name: "Customer Name"
```

Em caso de erro:
```
[ERROR] Failed to process webhook
  error: "Error message"
  stack: "Error stack trace"
```

Tentativas não autorizadas:
```
[WARN] Unauthorized webhook attempt - invalid secret
  ip: "192.168.1.1"
  url: "/webhook/abacatepay?webhookSecret=wrong"
```

## Documentação Swagger

A documentação completa da API, incluindo o webhook do AbacatePay, está disponível em:

```
http://localhost:3000/docs
```

Procure pela tag "webhooks" para visualizar todos os endpoints relacionados.

## Segurança

1. **Secret Token**: Sempre configure um token secreto forte e aleatório em `ABACATEPAY_TOKEN_SECRET`
2. **HTTPS**: Em produção, sempre use HTTPS para proteger os dados em trânsito
3. **Validação**: Todos os dados do webhook são validados com Zod antes de serem processados
4. **Logs**: Todas as tentativas de acesso não autorizadas são registradas para auditoria

## Arquitetura

A integração segue Clean Architecture com as seguintes camadas:

```
src/
├── validators/
│   └── abacatepay.validator.ts    # Schemas Zod para validação
├── services/
│   └── abacatepay.service.ts      # Lógica de negócio
├── controllers/
│   └── abacatepay.controller.ts   # Controle de requisições
├── routes/
│   └── abacatepay.routes.ts       # Definição de rotas
└── tests/
    └── abacatepay.test.ts         # Testes automatizados
```

## Próximos Passos

Possíveis melhorias futuras:
- [ ] Integração com Discord para notificações
- [ ] Webhook retry mechanism
- [ ] Webhook signature validation
- [ ] Support for batch webhooks
- [ ] Webhook event history/audit log


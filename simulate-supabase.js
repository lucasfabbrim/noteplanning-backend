#!/usr/bin/env node

// Simulador do Supabase para testar Edge Functions localmente
const http = require('http');
const url = require('url');

// Simular dados do banco
const mockData = {
  customers: [
    { id: 1, name: 'João Silva', email: 'joao@example.com', created_at: new Date().toISOString() },
    { id: 2, name: 'Maria Santos', email: 'maria@example.com', created_at: new Date().toISOString() }
  ],
  products: [
    { id: 1, name: 'Curso de Node.js', price: 299.90, created_at: new Date().toISOString() },
    { id: 2, name: 'Curso de React', price: 199.90, created_at: new Date().toISOString() }
  ],
  videos: [
    { id: 1, title: 'Introdução ao Node.js', duration: 1200, created_at: new Date().toISOString() },
    { id: 2, title: 'Fundamentos do React', duration: 1800, created_at: new Date().toISOString() }
  ],
  purchases: [
    { id: 1, customer_id: 1, product_id: 1, status: 'paid', created_at: new Date().toISOString() }
  ],
  memberships: [
    { id: 1, customer_id: 1, plan: 'premium', expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
  ]
};

// Simular cliente Supabase
class MockSupabaseClient {
  constructor() {
    this.auth = {
      getUser: async () => {
        // Simular usuário autenticado
        return {
          data: {
            user: {
              id: 'mock-user-id',
              email: 'test@example.com'
            }
          }
        };
      }
    };
  }

  from(table) {
    return {
      select: (columns = '*') => ({
        order: (column, options = {}) => ({
          eq: (column, value) => this._query(table, 'select', { columns, where: { [column]: value } }),
          then: (callback) => callback(this._query(table, 'select', { columns, order: { column, ...options } }))
        }),
        then: (callback) => callback(this._query(table, 'select', { columns }))
      }),
      insert: (data) => ({
        select: (columns = '*') => this._query(table, 'insert', { data, columns })
      }),
      update: (data) => ({
        eq: (column, value) => ({
          select: (columns = '*') => this._query(table, 'update', { data, where: { [column]: value }, columns })
        })
      })
    };
  }

  _query(table, operation, options = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = { data: null, error: null };

        try {
          switch (operation) {
            case 'select':
              let data = mockData[table] || [];
              
              // Aplicar filtros
              if (options.where) {
                data = data.filter(item => 
                  Object.entries(options.where).every(([key, value]) => item[key] === value)
                );
              }
              
              // Aplicar ordenação
              if (options.order) {
                data.sort((a, b) => {
                  const aVal = a[options.order.column];
                  const bVal = b[options.order.column];
                  return options.order.ascending ? aVal > bVal : aVal < bVal;
                });
              }
              
              result.data = data;
              break;

            case 'insert':
              const newItem = {
                id: Date.now(),
                ...options.data[0],
                created_at: new Date().toISOString()
              };
              mockData[table].push(newItem);
              result.data = [newItem];
              break;

            case 'update':
              const index = mockData[table].findIndex(item => 
                Object.entries(options.where).every(([key, value]) => item[key] === value)
              );
              if (index !== -1) {
                mockData[table][index] = { ...mockData[table][index], ...options.data };
                result.data = [mockData[table][index]];
              }
              break;
          }
        } catch (error) {
          result.error = { message: error.message };
        }

        resolve(result);
      }, 100); // Simular latência
    });
  }
}

// Simular Edge Function
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname.replace('/functions/v1/noteplanning-api', '');
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end('ok');
    return;
  }

  try {
    const supabase = new MockSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let response;

    switch (true) {
      case path === '/health' && method === 'GET':
        response = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'noteplanning-api'
        };
        res.writeHead(200);
        break;

      case path.startsWith('/api/customers') && method === 'GET':
        if (!user) {
          res.writeHead(401);
          response = { error: 'Unauthorized' };
          break;
        }
        const { data: customers } = await supabase.from('customers').select('*');
        response = { data: customers };
        res.writeHead(200);
        break;

      case path.startsWith('/api/customers') && method === 'POST':
        if (!user) {
          res.writeHead(401);
          response = { error: 'Unauthorized' };
          break;
        }
        const body = await getRequestBody(req);
        const { data: newCustomer } = await supabase.from('customers').insert([body]);
        response = { data: newCustomer };
        res.writeHead(201);
        break;

      case path.startsWith('/api/products') && method === 'GET':
        const { data: products } = await supabase.from('products').select('*');
        response = { data: products };
        res.writeHead(200);
        break;

      case path.startsWith('/api/videos') && method === 'GET':
        const { data: videos } = await supabase.from('videos').select('*');
        response = { data: videos };
        res.writeHead(200);
        break;

      case path.startsWith('/api/purchases') && method === 'GET':
        if (!user) {
          res.writeHead(401);
          response = { error: 'Unauthorized' };
          break;
        }
        const { data: purchases } = await supabase.from('purchases').select('*');
        response = { data: purchases };
        res.writeHead(200);
        break;

      case path.startsWith('/api/memberships') && method === 'GET':
        if (!user) {
          res.writeHead(401);
          response = { error: 'Unauthorized' };
          break;
        }
        const { data: memberships } = await supabase.from('memberships').select('*');
        response = { data: memberships };
        res.writeHead(200);
        break;

      case path.startsWith('/api/abacatepay') && method === 'POST':
        const webhookBody = await getRequestBody(req);
        console.log('AbacatePay webhook received:', webhookBody);
        response = { received: true };
        res.writeHead(200);
        break;

      default:
        res.writeHead(404);
        response = { error: 'Route not found' };
    }

    res.end(JSON.stringify(response));

  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Criar servidor
const server = http.createServer(handleRequest);
const PORT = 54321;

server.listen(PORT, () => {
  console.log(`🚀 Supabase Simulator rodando em http://localhost:${PORT}`);
  console.log(`📡 Edge Function disponível em: http://localhost:${PORT}/functions/v1/noteplanning-api`);
  console.log(`\n🧪 Para testar, execute: node test-edge-functions.js`);
  console.log(`\n📋 Endpoints disponíveis:`);
  console.log(`   GET  /functions/v1/noteplanning-api/health`);
  console.log(`   GET  /functions/v1/noteplanning-api/api/customers`);
  console.log(`   POST /functions/v1/noteplanning-api/api/customers`);
  console.log(`   GET  /functions/v1/noteplanning-api/api/products`);
  console.log(`   GET  /functions/v1/noteplanning-api/api/videos`);
  console.log(`   GET  /functions/v1/noteplanning-api/api/purchases`);
  console.log(`   GET  /functions/v1/noteplanning-api/api/memberships`);
  console.log(`   POST /functions/v1/noteplanning-api/api/abacatepay`);
  console.log(`\n⏹️  Para parar: Ctrl+C`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Parando servidor...');
  server.close(() => {
    console.log('✅ Servidor parado');
    process.exit(0);
  });
});


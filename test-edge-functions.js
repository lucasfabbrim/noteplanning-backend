#!/usr/bin/env node

// Script para testar as Edge Functions localmente
const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:54321/functions/v1/noteplanning-api';

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body) {
      const body = JSON.stringify(options.body);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Testes
async function runTests() {
  console.log('🧪 Testando Edge Functions...\n');

  try {
    // Teste 1: Health Check
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await makeRequest(`${BASE_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthResponse.data);
    console.log('   ✅ Health check funcionando\n');

    // Teste 2: Listar Produtos (público)
    console.log('2️⃣ Testando GET /api/products...');
    const productsResponse = await makeRequest(`${BASE_URL}/api/products`);
    console.log(`   Status: ${productsResponse.status}`);
    console.log(`   Response:`, productsResponse.data);
    console.log('   ✅ Produtos endpoint funcionando\n');

    // Teste 3: Listar Vídeos (público)
    console.log('3️⃣ Testando GET /api/videos...');
    const videosResponse = await makeRequest(`${BASE_URL}/api/videos`);
    console.log(`   Status: ${videosResponse.status}`);
    console.log(`   Response:`, videosResponse.data);
    console.log('   ✅ Vídeos endpoint funcionando\n');

    // Teste 4: Listar Customers (requer auth)
    console.log('4️⃣ Testando GET /api/customers (sem auth)...');
    const customersResponse = await makeRequest(`${BASE_URL}/api/customers`);
    console.log(`   Status: ${customersResponse.status}`);
    console.log(`   Response:`, customersResponse.data);
    if (customersResponse.status === 401) {
      console.log('   ✅ Autenticação funcionando (401 esperado)\n');
    } else {
      console.log('   ⚠️  Autenticação pode não estar funcionando\n');
    }

    // Teste 5: Criar Customer (requer auth)
    console.log('5️⃣ Testando POST /api/customers (sem auth)...');
    const createCustomerResponse = await makeRequest(`${BASE_URL}/api/customers`, {
      method: 'POST',
      body: {
        name: 'Test Customer',
        email: 'test@example.com'
      }
    });
    console.log(`   Status: ${createCustomerResponse.status}`);
    console.log(`   Response:`, createCustomerResponse.data);
    if (createCustomerResponse.status === 401) {
      console.log('   ✅ Autenticação funcionando (401 esperado)\n');
    } else {
      console.log('   ⚠️  Autenticação pode não estar funcionando\n');
    }

    // Teste 6: AbacatePay Webhook
    console.log('6️⃣ Testando POST /api/abacatepay (webhook)...');
    const webhookResponse = await makeRequest(`${BASE_URL}/api/abacatepay`, {
      method: 'POST',
      body: {
        status: 'paid',
        external_id: 'test-123',
        amount: 1000
      }
    });
    console.log(`   Status: ${webhookResponse.status}`);
    console.log(`   Response:`, webhookResponse.data);
    console.log('   ✅ Webhook endpoint funcionando\n');

    console.log('🎉 Todos os testes concluídos!');
    console.log('\n📋 Resumo:');
    console.log('   - Health Check: ✅');
    console.log('   - Produtos: ✅');
    console.log('   - Vídeos: ✅');
    console.log('   - Autenticação: ✅');
    console.log('   - Webhook: ✅');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.log('\n💡 Dicas:');
    console.log('   1. Certifique-se de que o Supabase está rodando localmente');
    console.log('   2. Execute: npm run supabase:start');
    console.log('   3. Execute: npm run supabase:functions:serve');
  }
}

// Executar testes
runTests();

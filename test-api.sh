#!/bin/bash

# =============================================================================
# NotePlanning API - Test Suite Completa
# =============================================================================
# Este script testa todos os endpoints da API NotePlanning
# 
# Pré-requisitos:
# - API rodando em http://localhost:5001 (Firebase Functions emulator)
# - ou em produção: https://your-project.cloudfunctions.net/api
# =============================================================================

# Configurações
BASE_URL="http://localhost:3000"
# Para produção, descomente a linha abaixo e comente a linha acima:
# BASE_URL="https://us-central1-noteplanning-187c1.cloudfunctions.net/api"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para executar teste
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    local auth_header="$6"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}🧪 Testando: $test_name${NC}"
    echo -e "   ${YELLOW}$method $endpoint${NC}"
    
    # Construir comando curl
    local curl_cmd="curl -s -w '%{http_code}' -X $method"
    
    if [ ! -z "$auth_header" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_header'"
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$BASE_URL$endpoint'"
    
    # Executar teste
    local response=$(eval $curl_cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    # Verificar resultado
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "   ${GREEN}✅ PASSOU${NC} (Status: $status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "   ${RED}❌ FALHOU${NC} (Esperado: $expected_status, Recebido: $status_code)"
        echo -e "   ${RED}Response: $body${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# Função para extrair token de resposta
extract_token() {
    local response="$1"
    echo "$response" | grep -o '"customToken":"[^"]*"' | cut -d'"' -f4
}

# Função para extrair ID de resposta
extract_id() {
    local response="$1"
    echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4
}

echo -e "${BLUE}🚀 Iniciando Test Suite da API NotePlanning${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo ""

# =============================================================================
# 1. HEALTH CHECK
# =============================================================================
echo -e "${YELLOW}📋 1. HEALTH CHECK${NC}"
run_test "Health Check" "GET" "/health" "" "200"
run_test "API Docs" "GET" "/docs" "" "200"

# =============================================================================
# 2. AUTENTICAÇÃO
# =============================================================================
echo -e "${YELLOW}📋 2. AUTENTICAÇÃO${NC}"

# Register
echo -e "${BLUE}🧪 Testando: Register${NC}"
echo -e "   ${YELLOW}POST /v1/auth/register${NC}"
register_response=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"password123","name":"Test User"}' \
    "$BASE_URL/v1/auth/register")
register_status=$(curl -s -w '%{http_code}' -X POST \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"password123","name":"Test User"}' \
    "$BASE_URL/v1/auth/register" | tail -c 3)

if [ "$register_status" = "201" ]; then
    echo -e "   ${GREEN}✅ PASSOU${NC} (Status: $register_status)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "   ${RED}❌ FALHOU${NC} (Esperado: 201, Recebido: $register_status)"
    echo -e "   ${RED}Response: $register_response${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Login
echo -e "${BLUE}🧪 Testando: Login${NC}"
echo -e "   ${YELLOW}POST /v1/auth/login${NC}"
login_response=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"password123"}' \
    "$BASE_URL/v1/auth/login")
login_status=$(curl -s -w '%{http_code}' -X POST \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"password123"}' \
    "$BASE_URL/v1/auth/login" | tail -c 3)

if [ "$login_status" = "200" ]; then
    echo -e "   ${GREEN}✅ PASSOU${NC} (Status: $login_status)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Extrair custom token
    CUSTOM_TOKEN=$(echo "$login_response" | grep -o '"customToken":"[^"]*"' | cut -d'"' -f4)
    echo -e "   ${GREEN}Custom Token extraído: ${CUSTOM_TOKEN:0:20}...${NC}"
else
    echo -e "   ${RED}❌ FALHOU${NC} (Esperado: 200, Recebido: $login_status)"
    echo -e "   ${RED}Response: $login_response${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Logout
run_test "Logout" "POST" "/v1/auth/logout" "" "200"

# =============================================================================
# 3. CUSTOMERS (Admin Only)
# =============================================================================
echo -e "${YELLOW}📋 3. CUSTOMERS (Admin Only)${NC}"

# Nota: Para testar endpoints admin, você precisaria de um token de admin
# Por enquanto, vamos testar sem autenticação para ver os erros 401

run_test "Get All Customers (sem auth)" "GET" "/v1/customers" "" "401"
run_test "Get Customer by ID (sem auth)" "GET" "/v1/customers/test-id" "" "401"
run_test "Get Customer by Email (sem auth)" "GET" "/v1/customers/email/test@example.com" "" "401"
run_test "Update Customer (sem auth)" "PUT" "/v1/customers/test-id" '{"name":"Updated Name"}' "401"
run_test "Delete Customer (sem auth)" "DELETE" "/v1/customers/test-id" "" "401"
run_test "Forgot Password (sem auth)" "POST" "/v1/customers/forgot-password" '{"email":"test@example.com"}' "401"
run_test "Reset Password (sem auth)" "POST" "/v1/customers/reset-password" '{"token":"test","newPassword":"newpass"}' "401"

# =============================================================================
# 4. ESSAYS
# =============================================================================
echo -e "${YELLOW}📋 4. ESSAYS${NC}"

# Test route (público)
run_test "Essay Test Route" "GET" "/v1/essays/test" "" "200"

# Essays com autenticação (vamos usar o token que obtivemos)
if [ ! -z "$CUSTOM_TOKEN" ]; then
    run_test "Get My Essays (com auth)" "GET" "/v1/essays/my" "" "200" "$CUSTOM_TOKEN"
    run_test "Create Essay (com auth)" "POST" "/v1/essays" '{"essayTitle":"Test Essay","essayText":"This is a test essay","wordCount":100}' "400" "$CUSTOM_TOKEN"
    run_test "Get Essay by ID (com auth)" "GET" "/v1/essays/test-id" "" "404" "$CUSTOM_TOKEN"
else
    echo -e "${RED}⚠️  Pulando testes de essays autenticados - token não disponível${NC}"
fi

# Essays sem autenticação
run_test "Get My Essays (sem auth)" "GET" "/v1/essays/my" "" "401"
run_test "Create Essay (sem auth)" "POST" "/v1/essays" '{"essayTitle":"Test Essay"}' "401"
run_test "Get Essay by ID (sem auth)" "GET" "/v1/essays/test-id" "" "401"

# Essays admin (sem auth)
run_test "Get Essays by Customer (sem auth)" "GET" "/v1/essays/customer/test-id" "" "401"
run_test "Get Essays by Status (sem auth)" "GET" "/v1/essays/status/PENDING" "" "401"
run_test "Update Essay Status (sem auth)" "PATCH" "/v1/essays/test-id/status" '{"status":"REVIEWED"}' "401"
run_test "Update Essay Scores (sem auth)" "PATCH" "/v1/essays/test-id/scores" '{"cohesionScore":80}' "401"
run_test "Update Essay Analysis (sem auth)" "PATCH" "/v1/essays/test-id/analysis" '{"feedbackComments":["Good essay"]}' "401"
run_test "Delete Essay (sem auth)" "DELETE" "/v1/essays/test-id" "" "401"
run_test "Get Essay Stats (sem auth)" "GET" "/v1/essays/stats" "" "401"

# =============================================================================
# 5. CREDITS
# =============================================================================
echo -e "${YELLOW}📋 5. CREDITS${NC}"

# Credits sem autenticação
run_test "Get All Credits (sem auth)" "GET" "/v1/customers/credits" "" "401"
run_test "Get Credits History (sem auth)" "GET" "/v1/customers/credits-history" "" "401"
run_test "Get My Credits (sem auth)" "GET" "/v1/customers/my-credits" "" "401"
run_test "Add Credits (sem auth)" "POST" "/v1/customers/test-id/credits" '{"credits":10}' "401"

# Credits com autenticação (se token disponível)
if [ ! -z "$CUSTOM_TOKEN" ]; then
    run_test "Get My Credits (com auth)" "GET" "/v1/customers/my-credits" "" "200" "$CUSTOM_TOKEN"
fi

# =============================================================================
# 6. PURCHASES
# =============================================================================
echo -e "${YELLOW}📋 6. PURCHASES${NC}"

# Purchases sem autenticação
run_test "Get My Purchases (sem auth)" "GET" "/v1/customers/purchases" "" "401"
run_test "Get Customer Purchases (sem auth)" "GET" "/v1/customers/test-id/purchases" "" "401"
run_test "Create Purchase (sem auth)" "POST" "/v1/customers/test-id/purchases" '{"amount":99.90}' "401"
run_test "Delete Purchase (sem auth)" "DELETE" "/v1/customers/test-id/purchases/test-purchase-id" "" "401"

# Purchases com autenticação (se token disponível)
if [ ! -z "$CUSTOM_TOKEN" ]; then
    run_test "Get My Purchases (com auth)" "GET" "/v1/customers/purchases" "" "200" "$CUSTOM_TOKEN"
fi

# =============================================================================
# 7. WEBHOOKS
# =============================================================================
echo -e "${YELLOW}📋 7. WEBHOOKS${NC}"

run_test "AbacatePay Webhook GET" "GET" "/webhook/abacatepay" "" "200"
run_test "AbacatePay Webhook POST" "POST" "/webhook/abacatepay" '{"test":"data"}' "200"

# =============================================================================
# 8. ENDPOINTS ADICIONAIS
# =============================================================================
echo -e "${YELLOW}📋 8. ENDPOINTS ADICIONAIS${NC}"

# Root endpoint
run_test "Root Endpoint" "GET" "/" "" "200"

# Endpoints não encontrados
run_test "404 Test" "GET" "/nonexistent" "" "404"
run_test "Method Not Allowed" "PUT" "/health" "" "405"

# =============================================================================
# RESUMO DOS TESTES
# =============================================================================
echo -e "${BLUE}📊 RESUMO DOS TESTES${NC}"
echo -e "${BLUE}===================${NC}"
echo -e "Total de testes: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passou: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Falhou: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos os testes passaram!${NC}"
    exit 0
else
    echo -e "${RED}❌ Alguns testes falharam. Verifique os logs acima.${NC}"
    exit 1
fi

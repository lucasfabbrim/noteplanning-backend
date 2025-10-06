const crypto = require('crypto');

// Public HMAC key
const ABACATEPAY_PUBLIC_KEY = "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

// Test payload
const payload = {
  "id": "log_12345abcdef",
  "data": {
    "payment": {
      "amount": 1000,
      "fee": 80,
      "method": "PIX"
    },
    "billing": {
      "amount": 1000,
      "couponsUsed": [],
      "customer": {
        "id": "cust_4hnLDN3YfUWrwQBQKYMwL6Ar",
        "metadata": {
          "cellphone": "11111111111",
          "email": "christopher@abacatepay.com",
          "name": "Christopher Ribeiro",
          "taxId": "12345678901"
        }
      },
      "frequency": "ONE_TIME",
      "id": "bill_QgW1BT3uzaDGR3ANKgmmmabZ",
      "kind": [
        "PIX"
      ],
      "paidAmount": 1000,
      "products": [
        {
          "externalId": "123",
          "id": "prod_RGKGsjBWsJwRn1mHyGMFJNjP",
          "quantity": 1
        }
      ],
      "status": "PAID"
    }
  },
  "devMode": false,
  "event": "billing.paid"
};

// Generate signature
const rawBody = JSON.stringify(payload);
const bodyBuffer = Buffer.from(rawBody, "utf8");

const signature = crypto
  .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
  .update(bodyBuffer)
  .digest("base64");

console.log('Payload:', rawBody);
console.log('Signature:', signature);

// Test with curl command
const curlCommand = `curl -X POST "https://noteplanning-backend.fly.dev/webhook/abacatepay" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: ${signature}" \\
  -d '${rawBody}'`;

console.log('\nCurl command:');
console.log(curlCommand);

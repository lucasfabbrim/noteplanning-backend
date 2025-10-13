import 'module-alias/register';
import 'dotenv/config';
import * as admin from 'firebase-admin';
import { buildServer } from './src/server';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('🔥 Firebase Admin initialized');
}

async function start() {
  try {
    const app = await buildServer();
    
    await app.listen({
      port: 3000,
      host: '0.0.0.0',
    });

    console.log('🚀 Test server is running on http://0.0.0.0:3000');
    console.log('📚 API Documentation available at http://0.0.0.0:3000/docs');
    console.log('🔥 Firebase Auth enabled');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();


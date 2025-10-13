import {setGlobalOptions, logger} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { buildServer } from './server';

// Configuração global do Firebase Functions
setGlobalOptions({maxInstances: 10});

// Inicializar Firebase Admin (apenas uma vez)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Cache do servidor para evitar recriar
let cachedApp: any = null;

// Função otimizada com Firebase Auth
export const api = onRequest({
  maxInstances: 10,
  timeoutSeconds: 60,
  memory: "1GiB",
}, async (request, response) => {
  try {
    logger.info("API Function called", {structuredData: true});

    // Usar servidor em cache ou criar novo
    if (!cachedApp) {
      cachedApp = await buildServer();
      await cachedApp.ready();
      logger.info("Fastify server initialized and cached");
    }

    // Emitir a requisição para o servidor Fastify
    cachedApp.server.emit('request', request, response);

  } catch (error) {
    logger.error("Error in API Function", error);
    response.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

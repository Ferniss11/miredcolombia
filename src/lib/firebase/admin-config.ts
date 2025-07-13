import * as admin from 'firebase-admin';

let adminServices: { db: admin.firestore.Firestore; auth: admin.auth.Auth } | null = null;

/**
 * Obtiene o inicializa la app de Firebase Admin usando credenciales separadas del entorno.
 * Este método es más robusto que parsear un JSON completo desde una variable de entorno.
 * Lanza un error detallado si la inicialización falla.
 * @returns Un objeto con las instancias de Firestore (db) y Auth (auth).
 */
export function getAdminServices() {
  if (adminServices) {
    return adminServices;
  }

  try {
    const ADMIN_APP_NAME = 'colombia-en-espana-admin';
    const existingApp = admin.apps.find(app => app?.name === ADMIN_APP_NAME);

    if (existingApp) {
      adminServices = {
        db: existingApp.firestore(),
        auth: existingApp.auth(),
      };
      return adminServices;
    }

    // Leer las credenciales de las variables de entorno separadas.
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      const missingKeys = [];
      if (!projectId) missingKeys.push('FIREBASE_ADMIN_PROJECT_ID');
      if (!clientEmail) missingKeys.push('FIREBASE_ADMIN_CLIENT_EMAIL');
      if (!privateKey) missingKeys.push('FIREBASE_ADMIN_PRIVATE_KEY');
      throw new Error(`Error CRÍTICO: Faltan las siguientes variables de entorno para Firebase Admin: ${missingKeys.join(', ')}`);
    }

    // Corregir el formato de la clave privada, reemplazando `\n` literal con saltos de línea reales.
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    }, ADMIN_APP_NAME);

    adminServices = {
      db: app.firestore(),
      auth: app.auth(),
    };

    return adminServices;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error CRÍTICO al inicializar Firebase Admin: ${error.message}`);
    }
    throw new Error('Un error desconocido ocurrió durante la inicialización de Firebase Admin.');
  }
}

import * as admin from 'firebase-admin';

const ADMIN_APP_NAME = 'colombia-en-espana-admin';

// Variable para cachear la instancia de los servicios una vez inicializados.
let adminServices: { db: admin.firestore.Firestore; auth: admin.auth.Auth } | null = null;

/**
 * Obtiene o inicializa la app de Firebase Admin y devuelve sus servicios.
 * Lanza un error detallado si la inicialización falla.
 * @returns Un objeto con las instancias de Firestore (db) y Auth (auth).
 */
export function getAdminServices() {
  // Si ya está inicializado, devuelve la instancia cacheada.
  if (adminServices) {
    return adminServices;
  }

  // Si no está inicializado, intenta configurarlo.
  try {
    // Intenta obtener una app existente por su nombre.
    const existingApp = admin.apps.find(app => app?.name === ADMIN_APP_NAME);
    const app = existingApp || admin.initializeApp({
      credential: admin.credential.cert(getServiceAccount()),
    }, ADMIN_APP_NAME);
    
    // Cachea los servicios para futuros usos.
    adminServices = {
      db: app.firestore(),
      auth: app.auth(),
    };
    
    return adminServices;

  } catch (error) {
    // Si cualquier parte de la inicialización falla, lanza un error detallado.
    if (error instanceof Error) {
      throw new Error(`Error CRÍTICO al inicializar Firebase Admin: ${error.message}`);
    }
    throw new Error('Un error desconocido ocurrió durante la inicialización de Firebase Admin.');
  }
}


/**
 * Lee las credenciales desde las variables de entorno y las formatea.
 * @returns El objeto de cuenta de servicio parseado.
 */
function getServiceAccount(): admin.ServiceAccount {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
    }

    try {
        // Robusto: Reemplaza \\n literales por \n reales para el parser de JSON.
        const CrorrectedFormatKey = serviceAccountKey.replace(/\\n/g, '\n');
        return JSON.parse(CrorrectedFormatKey);
    } catch(e) {
        if (e instanceof Error) {
            // Lanza un error más descriptivo para el problema más común.
            throw new Error(`Error al parsear el JSON de FIREBASE_SERVICE_ACCOUNT_KEY: ${e.message}. Asegúrate de que está en formato JSON válido y en una sola línea en el archivo .env.`);
        }
        throw new Error('Error desconocido al parsear el JSON de la clave de servicio.');
    }
}

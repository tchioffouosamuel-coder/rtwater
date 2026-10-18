/** Public browser configuration, supplied by the build environment. */
export function firebaseConfigFromEnv(env) {
  const value = name => String(env[name] ?? '').trim();
  return {
    apiKey: value('VITE_FIREBASE_API_KEY'),
    authDomain: value('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: value('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: value('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: value('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: value('VITE_FIREBASE_APP_ID'),
  };
}

export function isFirebaseConfigured(config) {
  return ['apiKey', 'projectId', 'messagingSenderId', 'appId'].every(field => Boolean(config[field]));
}

export function firebaseWorkerConfigSource(config) {
  // Serialize as data: quotes and line breaks must never become executable code.
  return `self.__RTW_FIREBASE_CONFIG__ = ${JSON.stringify(config).replaceAll('<', '\\u003c')};\n`;
}

/** Supply the classic service worker with the same env as the bundled client. */
export function firebaseWorkerConfigPlugin(env) {
  const config = firebaseConfigFromEnv(env);
  if (env.VITE_FIREBASE_VAPID_KEY?.trim() && !isFirebaseConfigured(config)) {
    throw new Error('FCM: renseigner VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_MESSAGING_SENDER_ID et VITE_FIREBASE_APP_ID dans l’environnement de build.');
  }
  const source = firebaseWorkerConfigSource(config);
  return {
    name: 'rtwater-firebase-worker-config',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== '/firebase-config.js') return next();
        response.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(source);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'firebase-config.js', source });
    },
  };
}

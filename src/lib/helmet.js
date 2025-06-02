// src/lib/helmet.js
let Helmet, HelmetProvider;

if (import.meta.env.SSR) {
  // --- SERVER-SIDE specific logic ---
  // For SSR, 'react-helmet-async' might be treated as a CommonJS-style module.
  // We expect its exports (Helmet, HelmetProvider) to be properties on either
  // the .default export of the module, or the module object itself.
  const helmetModule = await import('react-helmet-async');
  const exportsObject = helmetModule.default || helmetModule;
  Helmet = exportsObject.Helmet;
  HelmetProvider = exportsObject.HelmetProvider;
} else {
  // --- CLIENT-SIDE specific logic ---
  // For the client, 'react-helmet-async' is treated as an ES module
  // with named exports.
  const clientImports = await import('react-helmet-async');
  Helmet = clientImports.Helmet;
  HelmetProvider = clientImports.HelmetProvider;
}

// Optional: Add a more robust check for development or if issues arise
// if (import.meta.env.DEV && (!Helmet || !HelmetProvider)) {
//   const env = import.meta.env.SSR ? 'SSR' : 'Client';
//   console.warn(
//     `[${env}] Warning: Helmet or HelmetProvider might not have loaded correctly from react-helmet-async.`,
//     { Helmet, HelmetProvider }
//   );
// }

// Ensure components are actually found, otherwise export undefined which will cause errors.
// Throwing an error here might be better if they are critical for app functionality.
if (!Helmet || !HelmetProvider) {
  const env = import.meta.env.SSR ? 'SSR' : 'Client';
  const message = `[${env}] Critical error: Could not load Helmet or HelmetProvider from 'react-helmet-async'. This will cause rendering issues.`;
  console.error(message);
  // You might want to throw an error to halt execution if these are essential:
  // throw new Error(message);
  // Or assign placeholder/noop components if that makes sense for your error handling strategy.
}

export { Helmet, HelmetProvider };
// CommonJS wrapper that dynamically imports the ESM preload.
(async () => {
    const path = require('path');
    const { pathToFileURL } = require('url');
    const esmFile = path.join(__dirname, 'preload.js'); // compiled preload
    await import(pathToFileURL(esmFile).toString());
  })();
  
const { Builder } = require('selenium-webdriver');

(async () => {
  const url = 'http://localhost:8080/';
  const driver = await new Builder().forBrowser('safari').build();
  try {
    console.log('Ouverture de', url);
    await driver.get(url);
    const result = await driver.executeAsyncScript(function(timeout, callback) {
      (async () => {
        try {
          if (typeof navigator.serviceWorker === 'undefined') {
            return callback({ error: 'navigator.serviceWorker undefined' });
          }
          // fetch test
          let fetchStatus = null;
          try {
            const f = await fetch('/ngsw-worker.js', { cache: 'no-store' });
            fetchStatus = f.status;
          } catch (fe) {
            fetchStatus = 'fetch-error:' + String(fe);
          }
          // try register
          try {
            const reg = await navigator.serviceWorker.register('/ngsw-worker.js', { scope: '/' });
            const regs = await navigator.serviceWorker.getRegistrations();
            const scopes = regs.map(r => r.scope);
            callback({
              registered: true,
              scope: reg.scope,
              registrations: scopes,
              fetchStatus
            });
          } catch (re) {
            callback({ error: 'register-failed', detail: String(re), fetchStatus });
          }
        } catch (e) {
          callback({ error: 'unexpected', detail: String(e) });
        }
      })();
    }, 30000);
    console.log('Résultat:', result);
  } catch (err) {
    console.error('Erreur Selenium:', err);
  } finally {
    await driver.quit();
  }
})();

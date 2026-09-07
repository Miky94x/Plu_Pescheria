// Pulizia all'apertura
(async () => {
  try {
    localStorage.clear();
    sessionStorage.clear();

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
  } catch (err) {
    console.warn("Reset cache:", err);
  }
})();

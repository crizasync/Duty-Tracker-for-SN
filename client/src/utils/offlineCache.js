export function createOfflineCache(storage) {
  const key = (config, userId) => {
    if (!userId || config.method?.toLowerCase() !== 'get' || config.responseType === 'blob') return null;
    return `duty-tracker:api:${userId}:${config.baseURL || ''}:${config.url}:${JSON.stringify(config.params || {})}`;
  };
  return {
    save(config, userId, data) {
      const cacheKey = key(config, userId);
      if (!cacheKey) return;
      try { storage.setItem(cacheKey, JSON.stringify({ data, savedAt: Date.now() })); } catch { /* Cache is optional. */ }
    },
    read(config, userId) {
      const cacheKey = key(config, userId);
      if (!cacheKey) return null;
      try { return JSON.parse(storage.getItem(cacheKey) || 'null'); } catch { return null; }
    },
  };
}

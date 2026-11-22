export function createApiClient(baseUrl, serviceName) {
  return {
    async request(path, options = {}) {
      if (!baseUrl) {
        throw new Error(`Base URL ${serviceName} belum dikonfigurasi.`);
      }

      const base = new URL(baseUrl);

      if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
        throw new Error(`Base URL ${serviceName} harus berupa URL HTTP(S) tanpa kredensial, query, atau fragment.`);
      }

      if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
        throw new Error('Path API harus relatif terhadap base URL dan diawali satu garis miring.');
      }

      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, options);

      if (!response.ok) {
        throw new Error(`${serviceName}: HTTP ${response.status}`);
      }

      return response;
    },
  };
}

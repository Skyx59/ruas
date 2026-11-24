export function createApiClient(baseUrl, serviceName) {
  return {
    async request(path, options = {}) {
      if (!baseUrl) throw new Error(`Base URL ${serviceName} belum dikonfigurasi.`);
      const base = new URL(baseUrl);
      if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
        throw new Error(`Base URL ${serviceName} harus berupa URL HTTP(S) tanpa kredensial, query, atau fragment.`);
      }
      if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
        throw new Error('Path API harus relatif terhadap base URL dan diawali satu garis miring.');
      }
      const { timeoutMs = 15000, signal, ...requestOptions } = options;
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Batas waktu request harus positif.');
      const controller = new AbortController();
      const cancel = () => controller.abort();
      if (signal?.aborted) cancel();
      else signal?.addEventListener('abort', cancel, { once: true });
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
      try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, { ...requestOptions, signal: controller.signal });
        if (!response.ok) {
          let detail;
          try { detail = await response.json(); } catch { detail = null; }
          const error = new Error(detail?.error?.message || `${serviceName}: HTTP ${response.status}`);
          error.status = response.status;
          error.issues = detail?.error?.issues;
          throw error;
        }
        return response;
      } catch (cause) {
        if (timedOut) {
          const error = new Error(`${serviceName} belum merespons. Coba kembali setelah layanan tersedia.`);
          error.code = 'REQUEST_TIMEOUT';
          throw error;
        }
        if (cause?.name === 'AbortError') throw cause;
        if (cause?.status) throw cause;
        const error = new Error(`${serviceName} tidak dapat dihubungi. Periksa koneksi atau ketersediaan layanan.`);
        error.code = 'NETWORK_UNAVAILABLE';
        throw error;
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancel);
      }
    },
  };
}

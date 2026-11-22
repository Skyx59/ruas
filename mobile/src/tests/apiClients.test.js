import { createApiClient } from '../services/createApiClient';

describe('Batas konfigurasi client API', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test.each(['RUAS', 'StepSafe', 'Health'])('%s menolak request sebelum base URL dikonfigurasi', async (name) => {
    const client = createApiClient('', name);

    await expect(client.request('/')).rejects.toThrow('belum dikonfigurasi');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test.each(['https://other.invalid/', '//other.invalid/', '/\\other.invalid/'])('menolak path lintas layanan: %s', async (path) => {
    const client = createApiClient('https://service.invalid', 'Test');

    await expect(client.request(path)).rejects.toThrow('Path API');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test.each(['file:///local', 'https://user:secret@service.invalid', 'https://service.invalid?token=value'])('menolak base URL tidak sesuai: %s', async (baseUrl) => {
    const client = createApiClient(baseUrl, 'Test');

    await expect(client.request('/')).rejects.toThrow('Base URL');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

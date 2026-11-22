import { isCoordinate } from '../utils/validation';

function authorization(session) {
  if (!session?.accessToken) throw new Error('Masuk ke akun RUAS terlebih dahulu.');
  return { Authorization: `Bearer ${session.accessToken}` };
}

function accountFrom(user) {
  if (!user?.id || !user.username || user.is_active !== true) throw new Error('Identitas akun RUAS tidak valid.');
  return { id: user.id, username: user.username, displayName: user.username, role: user.role };
}

function reportFrom(report) {
  if (!report?.id || !isCoordinate(report)) throw new Error('Respons laporan RUAS tidak valid.');
  return {
    id: report.id,
    type: 'Laporan',
    title: report.description,
    description: report.description,
    location: { label: 'Lokasi laporan', coordinate: { latitude: report.latitude, longitude: report.longitude } },
    timeLabel: new Date(report.created_at).toLocaleString('id-ID'),
    severity: 'Belum disediakan API',
    status: report.verification_status,
    reporterLabel: 'Tidak disediakan API',
  };
}

export const ruasAdapter = {
  async login({ client, input }) {
    const body = `grant_type=password&username=${encodeURIComponent(input.username.trim())}&password=${encodeURIComponent(input.password)}`;
    const token = await (await client.request('/api/auth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })).json();
    if (!token.access_token || token.token_type !== 'bearer') throw new Error('Token login RUAS tidak valid.');
    const session = { accessToken: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
    const user = await (await client.request('/api/auth/me', { headers: authorization(session) })).json();
    return { ...session, account: accountFrom(user) };
  },
  async getProfile({ client, session }) {
    const user = await (await client.request('/api/auth/me', { headers: authorization(session) })).json();
    return { account: accountFrom(user) };
  },
  async listReports({ client, input }) {
    const offset = input?.offset || 0;
    const page = await (await client.request(`/api/road-reports?limit=100&offset=${offset}`)).json();
    if (!Array.isArray(page.items)) throw new Error('Daftar laporan RUAS tidak valid.');
    return page.items.map(reportFrom);
  },
  async getReport({ client, input }) {
    return reportFrom(await (await client.request(`/api/road-reports/${encodeURIComponent(input.reportId)}`)).json());
  },
  async createReport({ client, input, session }) {
    const headers = { ...authorization(session), 'Content-Type': 'application/json' };
    if (!isCoordinate(input.location?.coordinate)) throw new Error('Pilih lokasi kejadian di peta.');
    if (input.photo) throw new Error('API RUAS belum mendukung upload foto. Hapus foto untuk mengirim laporan teks.');
    const { latitude, longitude } = input.location.coordinate;
    const response = await client.request('/api/road-reports', { method: 'POST', headers, body: JSON.stringify({ latitude, longitude, description: input.description.trim() }) });
    return reportFrom(await response.json());
  },
  async confirmReport({ client, input, session }) {
    if (!['verified', 'rejected'].includes(input.condition)) throw new Error('Konfirmasi kondisi oleh warga belum didukung API. Verifikasi dan penolakan hanya tersedia untuk ADMIN.');
    if (session?.account?.role !== 'ADMIN') throw new Error('Hanya ADMIN yang dapat memverifikasi laporan.');
    const response = await client.request(`/api/road-reports/${encodeURIComponent(input.reportId)}/verification`, {
      method: 'PATCH', headers: { ...authorization(session), 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_status: input.condition }),
    });
    return reportFrom(await response.json());
  },
};

import { isCoordinate } from '../utils/validation';

const types = { flood: 'Banjir', traffic: 'Kemacetan', obstacle: 'Hambatan' };
const severities = { low: 'Ringan', medium: 'Sedang', high: 'Berat' };
const typeValues = Object.fromEntries(Object.entries(types).map(([key, value]) => [value, key]));
const severityValues = Object.fromEntries(Object.entries(severities).map(([key, value]) => [value, key]));

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
    type: types[report.incident_type] || 'Laporan',
    title: report.description,
    description: report.description,
    location: { label: report.location_label || 'Lokasi laporan', coordinate: { latitude: report.latitude, longitude: report.longitude } },
    timeLabel: new Date(report.created_at).toLocaleString('id-ID'),
    severity: severities[report.severity] || 'Tidak tercatat pada laporan lama',
    status: report.verification_status,
    reporterLabel: 'Tidak disediakan API',
  };
}

async function readReports(client, path, headers, offset = 0) {
  const reports = [];
  for (;;) {
    const page = await (await client.request(`${path}?limit=100&offset=${offset}`, { headers })).json();
    if (!Array.isArray(page.items) || page.items.length > 100) throw new Error('Daftar laporan RUAS tidak valid.');
    const items = page.items.map(reportFrom);
    reports.push(...items);
    if (items.length < 100) return reports;
    offset += items.length;
    if (offset > 10000) throw new Error('Daftar laporan terlalu besar untuk dimuat sekaligus.');
  }
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
    const headers = authorization(session);
    const profile = await (await client.request('/api/auth/me/profile', { headers })).json();
    const account = accountFrom(profile.account);
    const reports = await readReports(client, '/api/road-reports/mine', headers);
    return {
      account,
      statistics: profile.statistics,
      reports: reports.map(report => ({ ...report, ownerId: account.id, reporterLabel: account.displayName })),
    };
  },
  async listReports({ client, input }) {
    return readReports(client, '/api/road-reports', undefined, input?.offset || 0);
  },
  async getReport({ client, input }) {
    return reportFrom(await (await client.request(`/api/road-reports/${encodeURIComponent(input.reportId)}`)).json());
  },
  async createReport({ client, input, session }) {
    const headers = { ...authorization(session), 'Content-Type': 'application/json' };
    if (!isCoordinate(input.location?.coordinate)) throw new Error('Pilih lokasi kejadian di peta.');
    if (input.photo) throw new Error('API RUAS belum mendukung upload foto. Hapus foto untuk mengirim laporan teks.');
    const { latitude, longitude } = input.location.coordinate;
    const incident_type = typeValues[input.type];
    const severity = severityValues[input.severity];
    if (!incident_type || !severity) throw new Error('Jenis kejadian atau keparahan tidak valid.');
    const payload = { latitude, longitude, description: input.description.trim(), incident_type, severity, location_label: input.location.label?.trim().slice(0, 200) || null };
    const response = await client.request('/api/road-reports', { method: 'POST', headers, body: JSON.stringify(payload) });
    return { ...reportFrom(await response.json()), ownerId: session.account.id, reporterLabel: session.account.displayName };
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

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import ApiService from '../services/ApiService';
import { demoFacilities, demoReports, demoRoutes, demoTrip, demoWeather } from '../preview/demoData';
import { validateTrip } from '../utils/validation';
import { getDeviceLocation } from '../services/deviceLocation';

export const AppContext = createContext(null);

const emptyTrip = () => ({ origin: { label: '', coordinate: null }, destination: { label: '', coordinate: null } });
const emptyData = () => ({ reports: [], facilities: [], weather: null, profile: null });

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [demoEnabled, setDemoEnabled] = useState(process.env.EXPO_PUBLIC_ENABLE_DEMO === 'true');
  const [trip, setTripState] = useState(demoEnabled ? demoTrip : emptyTrip);
  const [travelMode, setTravelModeState] = useState('vehicle');
  const [data, setData] = useState(emptyData);
  const [dataMessage, setDataMessage] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [reportLocation, setReportLocation] = useState(null);
  const [mapSelection, setMapSelection] = useState(null);
  const [walkability, setWalkability] = useState(null);
  const dataVersion = useRef(0);
  const sessionVersion = useRef(0);
  const routeVersion = useRef(0);

  const refreshData = useCallback(async () => {
    const version = ++dataVersion.current;
    if (demoEnabled) return;
    const tasks = [
      ['ruas', 'listReports', 'reports'],
      ['ruas', 'getWeather', 'weather'],
      ['health', 'listFacilities', 'facilities'],
      ...(session ? [['ruas', 'getProfile', 'profile']] : []),
    ].filter(([provider, operation]) => ApiService.hasOperation(provider, operation));
    const results = await Promise.allSettled(tasks.map(async ([provider, operation, key]) => {
      const value = await ApiService[provider][operation](undefined, provider === 'ruas' ? session : null);
      if (['reports', 'facilities'].includes(key) && !Array.isArray(value)) throw new Error('Adapter harus mengembalikan daftar data untuk layar.');
      return [key, value];
    }));
    if (version !== dataVersion.current) return;
    const updates = Object.fromEntries(results.filter(result => result.status === 'fulfilled').map(result => result.value));
    setData(previous => {
      const reports = updates.reports || previous.reports;
      const owned = updates.profile?.reports || previous.profile?.reports || [];
      const combined = new Map(reports.map(report => [report.id, report]));
      for (const report of owned) combined.set(report.id, { ...combined.get(report.id), ...report });
      return { ...previous, ...updates, reports: [...combined.values()] };
    });
    setDataMessage(results.find(result => result.status === 'rejected')?.reason?.message || '');
    const account = updates.profile?.account;
    if (account) setSession(previous => previous && JSON.stringify(previous.account) !== JSON.stringify(account) ? { ...previous, account } : previous);
  }, [demoEnabled, session]);

  useEffect(() => {
    refreshData();
    return () => { dataVersion.current += 1; };
  }, [refreshData]);

  useEffect(() => {
    if (demoEnabled) return;
    let current = true;
    getDeviceLocation().then(point => {
      if (current) {
        setLocationMessage('');
        setTripState(previous => previous.origin.coordinate ? previous : { ...previous, origin: point });
      }
    }).catch(error => { if (current) setLocationMessage(error.message); });
    return () => { current = false; };
  }, [demoEnabled]);

  function updateTrip(key, point) {
    routeVersion.current += 1;
    if (!['origin', 'destination'].includes(key)) return;
    setTripState(previous => ({ ...previous, [key]: point }));
    setActiveRoute(null);
    setRoutes([]);
    setSelectedRouteId(null);
    setWalkability(null);
  }

  function changeTravelMode(mode) {
    routeVersion.current += 1;
    setTravelModeState(mode);
    setActiveRoute(null);
    setRoutes([]);
    setSelectedRouteId(null);
    setWalkability(null);
  }

  function changeDataMode(enabled) {
    sessionVersion.current += 1;
    dataVersion.current += 1;
    routeVersion.current += 1;
    setDemoEnabled(enabled);
    setTripState(enabled ? demoTrip : emptyTrip());
    setRoutes([]);
    setSelectedRouteId(null);
    setActiveRoute(null);
    setReportLocation(null);
    setWalkability(null);
    setMapSelection(null);
  }

  const recommendRoutes = useCallback(async () => {
    const errors = validateTrip(trip);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    const version = ++routeVersion.current;
    let result;
    if (demoEnabled) {
      if (trip.origin.label !== demoTrip.origin.label || trip.destination.label !== demoTrip.destination.label || travelMode !== 'vehicle') {
        throw new Error('Contoh rute hanya tersedia untuk Kampus ITB ke RS Hasan Sadikin dengan kendaraan. Rute lain memerlukan API RUAS; tidak ada skor yang dihitung di mobile.');
      }
      result = demoRoutes;
    } else {
      result = await ApiService.ruas.recommendRoutes({ trip, travelMode }, session);
    }
    if (!Array.isArray(result)) throw new Error('Adapter rekomendasi harus mengembalikan daftar alternatif rute.');
    if (version !== routeVersion.current) return;
    setRoutes(result);
    setSelectedRouteId(result[0]?.id || null);
  }, [demoEnabled, trip, travelMode, session]);

  async function loadWalkability() {
    if (demoEnabled) throw new Error('Pratinjau tidak menyediakan Walkability Index. Nilai hanya boleh berasal dari StepSafe.');
    const version = routeVersion.current;
    const result = await ApiService.stepSafe.getWalkability({ trip });
    if (version === routeVersion.current) setWalkability(result);
  }

  function activateRoute() {
    const selected = routes.find(route => route.id === selectedRouteId);
    if (!selected) throw new Error('Pilih alternatif rute terlebih dahulu.');
    setActiveRoute({ ...selected, trip, travelMode });
  }

  async function login(values) {
    const result = await ApiService.ruas.login(values);
    if (!result?.account?.id || !result.account.displayName) throw new Error('Adapter autentikasi belum menghasilkan sesi akun yang valid.');
    sessionVersion.current += 1;
    setData(emptyData());
    if (demoEnabled) changeDataMode(false);
    setSession(result);
  }

  async function register(values) {
    return ApiService.ruas.register(values);
  }

  async function logout() {
    try {
      if (ApiService.hasOperation('ruas', 'logout')) await ApiService.ruas.logout(undefined, session);
    } finally {
      sessionVersion.current += 1;
      dataVersion.current += 1;
      routeVersion.current += 1;
      setSession(null);
      setData(emptyData());
      setActiveRoute(null);
      setRoutes([]);
      setSelectedRouteId(null);
      setWalkability(null);
    }
  }

  async function submitReport(draft) {
    if (demoEnabled) throw new Error('Mode demo hanya untuk pratinjau. Laporan dan foto tidak dikirim atau disimpan sebagai laporan nyata.');
    const version = sessionVersion.current;
    const result = await ApiService.ruas.createReport(draft, session);
    if (version !== sessionVersion.current) throw new Error('Laporan diterima server, tetapi sesi berubah. Buka akun pengirim untuk melihat riwayat.');
    dataVersion.current += 1;
    if (!result?.id) throw new Error('Adapter laporan belum menghasilkan data laporan yang valid.');
    setData(previous => {
      const profile = previous.profile;
      const statistics = profile?.statistics;
      return {
        ...previous,
        reports: [result, ...previous.reports.filter(report => report.id !== result.id)],
        profile: profile ? {
          ...profile,
          reports: [result, ...(profile.reports || []).filter(report => report.id !== result.id)],
          statistics: statistics ? { ...statistics, reports: statistics.reports + 1 } : statistics,
        } : profile,
      };
    });
    refreshData();
    return result;
  }

  async function confirmReport(reportId, condition) {
    if (demoEnabled) throw new Error('Laporan demo tidak dapat diverifikasi sebagai kejadian nyata. Tidak ada konfirmasi yang dikirim.');
    const version = sessionVersion.current;
    const result = await ApiService.ruas.confirmReport({ reportId, condition }, session);
    if (version !== sessionVersion.current) throw new Error('Status diproses server, tetapi sesi berubah. Muat ulang laporan untuk melihat hasilnya.');
    dataVersion.current += 1;
    if (!result?.id || result.id !== reportId) throw new Error('Adapter konfirmasi belum menghasilkan laporan yang sesuai.');
    setData(previous => ({ ...previous, reports: previous.reports.map(report => report.id === reportId ? { ...report, ...result } : report) }));
    refreshData();
  }

  const reports = demoEnabled ? demoReports : data.reports;
  const facilities = demoEnabled ? demoFacilities : data.facilities;

  return (
    <AppContext.Provider value={{
      session, login, register, logout,
      demoEnabled, changeDataMode,
      reports, facilities, weather: demoEnabled ? demoWeather : data.weather, profile: data.profile,
      dataMessage, locationMessage, refreshData,
      trip, updateTrip, travelMode, changeTravelMode,
      routes, selectedRouteId, setSelectedRouteId, activeRoute, recommendRoutes, activateRoute,
      walkability, loadWalkability,
      reportLocation, setReportLocation, mapSelection, setMapSelection,
      submitReport, confirmReport,
    }}>
      {children}
    </AppContext.Provider>
  );
}

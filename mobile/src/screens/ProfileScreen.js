import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Badge, Button, Card, Feedback, GradientCard, Header, Screen, SectionHeading, layout } from '../components/ui';
import DataNotice from '../components/DataNotice';
import AccountHero from '../components/AccountHero';
import V3Icon from '../components/V3Icon';
import { reportStatus } from '../components/ReportSummary';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { theme } from '../theme';

function MenuItem({ icon, title, description, onPress }) {
  return <Pressable accessibilityRole="button" onPress={onPress}><Card style={{ flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 69, padding: 12 }}><View style={{ padding: 9, backgroundColor: theme.colors.soft, borderRadius: 11 }}><V3Icon name={icon} /></View><View style={[layout.flex, { gap: 4 }]}><AppText variant="label">{title}</AppText><AppText variant="tiny" color={theme.colors.muted}>{description}</AppText></View></Card></Pressable>;
}

export default function ProfileScreen({ navigation }) {
  const { session, profile, reports, demoEnabled, logout } = useAppContext();
  const [panel, setPanel] = useState(null);
  const action = useAction();
  const history = demoEnabled ? reports : session ? reports.filter(report => report.ownerId === session.account.id) : [];
  const visible = panel === 'verification' ? history.filter(report => report.status !== 'pending') : history;
  function toggle(next) { setPanel(previous => previous === next ? null : next); }
  return <Screen>
    <Header title="Akun & Profil" subtitle="Kelola akun dan aktivitas perjalanan Anda" />
    <DataNotice />
    <AccountHero account={session?.account} />
    {session && <AppText variant="caption" color={theme.colors.muted}>Username: {session.account.username} · {session.account.role}</AppText>}
    {!session && <View style={layout.row}><Button title="Login" onPress={() => navigation.navigate('Login')} style={layout.flex} /><Button title="Registrasi" variant="outline" onPress={() => navigation.navigate('Registrasi')} style={layout.flex} /></View>}
    <View style={layout.section}><SectionHeading>Kontribusi Anda</SectionHeading><GradientCard colors={[theme.colors.surface, '#EFF2FF']} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: 13, padding: 16 }}>
      <View style={layout.row}>{[['Laporan', 'reports'], ['Terverifikasi', 'verified'], ['Konfirmasi', 'confirmations']].map(([label, key], index) => <View key={key} style={{ flex: 1, gap: 4, paddingLeft: index ? 12 : 4, borderLeftWidth: index ? 1 : 0, borderLeftColor: theme.colors.border }}><AppText style={{ fontFamily: theme.fonts.semibold, fontSize: 23, color: index === 2 ? '#DF8C1B' : theme.colors.primary }}>{session && profile?.statistics?.[key] != null ? String(profile.statistics[key]) : '—'}</AppText><AppText variant="tiny" color={theme.colors.muted}>{label}</AppText></View>)}</View>
    </GradientCard></View>
    <View style={layout.section}><SectionHeading>Aktivitas</SectionHeading><MenuItem icon="history" title="Riwayat Laporan" description="Lihat laporan yang pernah dibuat" onPress={() => toggle('history')} /><MenuItem icon="verification" title="Status Verifikasi" description="Pantau laporan dan konfirmasi warga" onPress={() => toggle('verification')} /></View>
    {['history', 'verification'].includes(panel) && <View style={layout.group}>
      <AppText variant="label">{demoEnabled ? 'Contoh laporan komunitas · bukan riwayat akun' : panel === 'history' ? 'Riwayat laporan Anda' : 'Status laporan Anda'}</AppText>
      {!demoEnabled && !session && <AppText variant="caption" color={theme.colors.muted}>Masuk untuk melihat riwayat akun. API belum menyediakan kepemilikan laporan atau statistik kontribusi.</AppText>}
      {!visible.length && <AppText variant="caption" color={theme.colors.muted}>Belum ada data riwayat yang dapat ditampilkan.</AppText>}
      {visible.map(report => <Pressable key={report.id} accessibilityRole="button" onPress={() => navigation.navigate('DetailLaporan', { reportId: report.id })}><Card><AppText variant="label">{report.title}</AppText><Badge tone={reportStatus[report.status]?.tone}>{reportStatus[report.status]?.label || 'Status belum dipetakan'}</Badge></Card></Pressable>)}
    </View>}
    <View style={layout.section}><SectionHeading>Pengaturan</SectionHeading><MenuItem icon="about" title="Tentang RUAS" description="Informasi aplikasi dan layanan" onPress={() => toggle('about')} />{panel === 'about' && <AppText variant="caption" color={theme.colors.muted}>RUAS membantu membandingkan perjalanan berdasarkan kondisi jalan dan risiko relatif. Data demo hanya pratinjau. Integrasi layanan nyata menunggu kontrak RUAS, StepSafe, dan Health.</AppText>}</View>
    {session && <Pressable accessibilityRole="button" accessibilityLabel="Keluar dari akun" disabled={action.busy} onPress={() => action.run(logout)} style={[layout.row, { padding: 8 }]}><V3Icon name="logout" /><AppText variant="caption" color={theme.colors.danger}>{action.busy ? 'Mengakhiri sesi…' : 'Keluar dari Akun'}</AppText></Pressable>}
    <Feedback message={action.message} />
  </Screen>;
}

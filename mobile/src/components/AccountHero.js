import { View } from 'react-native';
import { AppText, Badge, GradientCard, layout } from './ui';
import V3Icon from './V3Icon';
import { theme } from '../theme';

export default function AccountHero({ account, login = false }) {
  return <GradientCard colors={[theme.colors.dark, login ? '#324FAD' : '#2B4795']} style={{ minHeight: 116, justifyContent: 'center', borderRadius: login ? 18 : 16, paddingVertical: 14, paddingHorizontal: login ? 21 : 16 }}>
    <View style={[layout.row, { gap: 16 }]}>
      <View style={{ width: login ? 62 : 64, height: login ? 62 : 64 }}><V3Icon name={login ? 'loginAvatar' : 'profileAvatar'} /><View style={{ position: 'absolute', left: 17, top: 15 }}><V3Icon name={login ? 'loginUser' : 'profileUser'} /></View></View>
      <View style={{ flex: 1, gap: 6, paddingRight: 24 }}>
        <AppText variant="heading" color={theme.colors.surface} style={login && { fontSize: 21, lineHeight: 27 }}>{login ? 'Selamat Datang' : account?.displayName || 'Pengunjung RUAS'}</AppText>
        <AppText variant="caption" color="#E0E7FA">{login ? 'Masuk untuk melaporkan dan memantau kondisi jalan.' : account?.username || 'Masuk untuk mengelola kontribusi Anda.'}</AppText>
        {!login && <Badge>{account ? 'Akun aktif' : 'Belum masuk'}</Badge>}
      </View>
    </View>
    <View style={{ position: 'absolute', right: -18, top: -12, opacity: 0.25, pointerEvents: 'none' }}><V3Icon name={login ? 'loginMotif' : 'profileMotif'} /></View>
  </GradientCard>;
}

import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Feedback, Field, Header, Notice, Screen, TextLink, layout } from '../components/ui';
import AccountHero from '../components/AccountHero';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { validateCredentials } from '../utils/validation';
import { theme } from '../theme';

export default function LoginScreen({ navigation, route }) {
  const { login } = useAppContext();
  const [email, setEmail] = useState(route.params?.email || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const action = useAction();
  function submit() {
    const values = { email: email.trim(), password };
    const next = validateCredentials(values);
    setErrors(next);
    if (!Object.keys(next).length) action.run(() => login(values), () => { setPassword(''); navigation.popTo('Main', { screen: 'Profile' }); });
  }
  return <Screen contentStyle={{ gap: 22 }}>
    <Header title="" navigation={navigation} />
    <AccountHero login />
    <View style={{ gap: 7, marginTop: 6 }}><AppText variant="title" style={{ color: theme.colors.text }}>Masuk ke Akun</AppText><AppText variant="caption" color={theme.colors.muted}>Gunakan email dan password Anda.</AppText></View>
    <Field label="Email" placeholder="nama@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" error={errors.email} />
    <Field label="Password" placeholder="Masukkan password" value={password} onChangeText={setPassword} password autoCapitalize="none" autoComplete="current-password" error={errors.password} />
    <AppText variant="caption" color={theme.colors.muted}>Masukkan password akun Anda.</AppText>
    <Feedback message={action.message} />
    <Button title="Masuk ke RUAS" onPress={submit} busy={action.busy} />
    <Notice title="Akses akun melindungi laporan Anda" detail="Konfirmasi dan riwayat tersimpan dengan aman setelah layanan terhubung." icon="shieldLogin" gradient />
    <View style={[layout.row, { justifyContent: 'center', marginTop: 'auto', paddingVertical: 22 }]}><AppText variant="caption" color={theme.colors.muted}>Belum memiliki akun?</AppText><TextLink onPress={() => navigation.replace('Register')}>Daftar sekarang</TextLink></View>
  </Screen>;
}

import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Feedback, Field, Header, Notice, Screen, TextLink, layout } from '../components/ui';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { validateCredentials } from '../utils/validation';
import { theme } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAppContext();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [acceptedEmail, setAcceptedEmail] = useState(null);
  const action = useAction();
  function update(key, value) { setValues(previous => ({ ...previous, [key]: value })); }
  function submit() {
    const next = validateCredentials(values, true);
    setErrors(next);
    if (Object.keys(next).length) return;
    action.run(() => register({ name: values.name.trim(), email: values.email.trim(), password: values.password }), result => {
      if (result?.accepted !== true) return action.setMessage('Adapter registrasi belum mengonfirmasi pembuatan akun. Sesi tidak dibuat.');
      setAcceptedEmail(values.email.trim());
      setValues(previous => ({ ...previous, password: '', confirmPassword: '' }));
    });
  }
  return <Screen contentStyle={{ gap: 18 }}>
    <Header title="" navigation={navigation} />
    <Header title="Buat Akun RUAS" subtitle="Bergabung untuk membantu pengguna jalan." />
    <Notice title="Pendaftaran online belum tersedia" detail="Endpoint registrasi belum disediakan backend RUAS. Form dapat divalidasi, tetapi akun belum dapat dibuat dari aplikasi." icon="shieldRegister" gradient />
    <Field label="Nama Lengkap" placeholder="Masukkan nama lengkap" value={values.name} onChangeText={value => update('name', value)} autoComplete="name" error={errors.name} />
    <Field label="Email" placeholder="nama@email.com" value={values.email} onChangeText={value => update('email', value)} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" error={errors.email} />
    <Field label="Password" placeholder="Minimal 8 karakter" value={values.password} onChangeText={value => update('password', value)} password registration autoCapitalize="none" autoComplete="new-password" error={errors.password} />
    <Field label="Konfirmasi Password" placeholder="Ulangi password" value={values.confirmPassword} onChangeText={value => update('confirmPassword', value)} password registration autoCapitalize="none" autoComplete="new-password" error={errors.confirmPassword} />
    <AppText variant="tiny" color={theme.colors.muted}>Password harus sesuai dan minimal 8 karakter.</AppText>
    <Feedback message={action.message} />
    {acceptedEmail ? <><AppText variant="caption" color={theme.colors.success}>Registrasi dikonfirmasi layanan RUAS. Silakan masuk dengan akun Anda.</AppText><Button title="Lanjut ke Login" onPress={() => navigation.replace('Login', { email: acceptedEmail })} /></> : <Button title="Daftar Akun" busy={action.busy} onPress={submit} />}
    <View style={[layout.row, { justifyContent: 'center', marginTop: 8, paddingVertical: 22 }]}><AppText variant="caption" color={theme.colors.muted}>Sudah memiliki akun?</AppText><TextLink onPress={() => navigation.replace('Login')}>Masuk</TextLink></View>
  </Screen>;
}

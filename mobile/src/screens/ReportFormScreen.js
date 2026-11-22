import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppText, Button, Chips, Feedback, Field, GradientCard, Header, Notice, Screen, TextLink, layout } from '../components/ui';
import DataNotice from '../components/DataNotice';
import V3Icon from '../components/V3Icon';
import { useAppContext } from '../hooks/useAppContext';
import { useAction } from '../hooks/useAction';
import { getDeviceLocation } from '../services/deviceLocation';
import { incidentTypes, severityLevels, validateReport } from '../utils/validation';
import { theme } from '../theme';

export default function ReportFormScreen({ navigation }) {
  const { reportLocation, setReportLocation, submitReport, session } = useAppContext();
  const [type, setType] = useState('Banjir');
  const [severity, setSeverity] = useState('Sedang');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const action = useAction();
  const device = useAction();
  const photoAction = useAction();

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Izin galeri belum diberikan. Foto bersifat opsional.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: false });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.mimeType && !['image/jpeg', 'image/png'].includes(asset.mimeType)) throw new Error('Pilih foto dengan format JPG atau PNG.');
    setPhoto({ uri: asset.uri, mimeType: asset.mimeType || null, fileName: asset.fileName || null });
  }

  function submit() {
    const draft = { location: reportLocation, type, severity, description: description.trim(), photo };
    const next = validateReport(draft);
    setErrors(next);
    if (Object.keys(next).length) return;
    action.run(() => submitReport(draft), report => {
      setDescription('');
      setPhoto(null);
      setReportLocation(null);
      navigation.navigate('DetailLaporan', { reportId: report.id });
    });
  }

  return <Screen>
    <Header title="Lapor Kondisi Jalan" subtitle="Bagikan kondisi nyata untuk pengguna lain" />
    <DataNotice />
    <GradientCard colors={['#EDF1FF', theme.colors.background]} style={{ padding: 15, borderRadius: 13, gap: 8 }}>
      <View style={layout.row}><V3Icon name="pinReport" /><View style={[layout.flex, { gap: 5 }]}><AppText variant="label">Lokasi Kejadian</AppText><AppText variant="tiny" color={theme.colors.muted}>{reportLocation?.label || 'Pilih lokasi kejadian di peta atau gunakan GPS.'}</AppText></View></View>
      <View style={layout.between}><TextLink onPress={() => navigation.navigate('PilihLokasi', { selection: 'report' })}>Pilih titik di peta →</TextLink><TextLink onPress={() => device.run(getDeviceLocation, setReportLocation)}>{device.busy ? 'Mencari…' : 'Gunakan GPS'}</TextLink></View>
    </GradientCard>
    <Feedback message={device.message || (!reportLocation ? errors.location : null)} />
    <View style={layout.group}><AppText variant="label">Jenis Kejadian</AppText><Chips options={incidentTypes} value={type} onChange={setType} /><Feedback message={errors.type} /></View>
    <View style={layout.group}><AppText variant="label">Tingkat Keparahan</AppText><Chips options={severityLevels} value={severity} onChange={setSeverity} tone={severity === 'Berat' ? 'danger' : severity === 'Ringan' ? 'success' : 'warning'} /><Feedback message={errors.severity} /></View>
    <View style={layout.group}><Field label="Deskripsi" placeholder="Contoh: genangan air di sebagian badan jalan, kendaraan harus melambat…" value={description} onChangeText={setDescription} multiline maxLength={300} inputStyle={{ minHeight: 100, textAlignVertical: 'top' }} error={errors.description} /><AppText variant="tiny" color={theme.colors.muted} style={{ textAlign: 'right', marginTop: -5 }}>{description.length} / 300 karakter</AppText></View>
    <View style={layout.group}>
      <AppText variant="label">Bukti Pendukung</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Unggah foto kejadian" disabled={photoAction.busy} onPress={() => photoAction.run(pickPhoto)} style={{ padding: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 58, height: 57, backgroundColor: theme.colors.background, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><V3Icon name="camera" /></View>
        <View style={layout.flex}><AppText variant="label">{photo ? 'Ganti foto kejadian' : 'Unggah foto kejadian'}</AppText><AppText variant="tiny" color={theme.colors.muted} style={{ marginTop: 5 }}>Opsional · JPG, PNG</AppText></View>
      </Pressable>
      {photo && <><Image source={{ uri: photo.uri }} accessibilityLabel="Pratinjau foto yang dipilih, belum diunggah" style={{ width: '100%', height: 160, borderRadius: 12 }} /><TextLink onPress={() => setPhoto(null)}>Hapus foto</TextLink></>}
      <Feedback message={photoAction.message} />
    </View>
    <Notice title="Laporan diverifikasi ADMIN" detail="API saat ini menyimpan lokasi dan deskripsi. Jenis serta keparahan belum didukung; foto belum dapat diunggah." />
    <Feedback message={action.message} />
    {!session && <TextLink onPress={() => navigation.navigate('Login')}>Masuk untuk mengirim laporan</TextLink>}
    <Button title="Kirim Laporan" onPress={submit} busy={action.busy} />
  </Screen>;
}

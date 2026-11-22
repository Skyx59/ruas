import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import V3Icon from './V3Icon';

export function AppText({ children, variant = 'body', color, style, ...props }) {
  return <Text {...props} style={[styles.text, textVariants[variant], color && { color }, style]}>{children}</Text>;
}

export function Screen({ children, contentStyle, scroll = true }) {
  const navigation = useNavigation();
  const isTab = navigation.getState().type === 'tab';
  const paddingBottom = 16;
  const content = scroll ? <ScrollView automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom }, contentStyle]}>{children}</ScrollView> : <View style={[styles.content, styles.flex, { paddingBottom }, contentStyle]}>{children}</View>;
  return <SafeAreaView edges={isTab ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']} style={styles.screen}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? undefined : 'height'}>{content}</KeyboardAvoidingView></SafeAreaView>;
}

export function Header({ title, subtitle, navigation, trailing, brand = false }) {
  return <View style={styles.header}>
    <View style={styles.row}>
      {navigation && <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={() => navigation.goBack()} hitSlop={10}><V3Icon name="back" /></Pressable>}
      <View style={[styles.row, styles.flex]}><AppText variant="title" style={brand && { fontSize: 23 }}>{title}</AppText>{brand && <V3Icon name="brand" />}</View>
      {trailing}
    </View>
    {subtitle && <AppText variant="caption" color={theme.colors.muted}>{subtitle}</AppText>}
  </View>;
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GradientCard({ children, colors = [theme.colors.dark, theme.colors.primary], style }) {
  return <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradient, style]}>{children}</LinearGradient>;
}

export function Button({ title, onPress, variant = 'primary', busy = false, disabled = false, small = false, icon, style }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [styles.button, variant === 'outline' && styles.buttonOutline, small && styles.buttonSmall, (disabled || busy) && { opacity: 0.6 }, pressed && { opacity: 0.8 }, style]}>
    <AppText variant={small ? 'tinyStrong' : 'button'} color={variant === 'outline' ? theme.colors.primary : theme.colors.surface}>{busy ? 'Memproses…' : title}</AppText>
    {icon && <V3Icon name={icon} />}
  </Pressable>;
}

export function TextLink({ children, onPress, color = theme.colors.primary, style }) {
  return <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6} style={style}><AppText variant="tinyStrong" color={color}>{children}</AppText></Pressable>;
}

export function SectionHeading({ children, action, onAction }) {
  return <View style={styles.between}><AppText variant="heading">{children}</AppText>{action && <TextLink onPress={onAction}>{action}</TextLink>}</View>;
}

export function Field({ label, error, password = false, registration = false, icon, style, inputStyle, ...props }) {
  const [visible, setVisible] = useState(false);
  return <View style={[styles.fieldGroup, style]}>
    {label && <AppText variant="label">{label}</AppText>}
    <View style={[styles.inputRow, error && { borderColor: theme.colors.danger }]}>
      {icon && <V3Icon name={icon} />}
      <TextInput {...props} accessibilityLabel={props.accessibilityLabel || label || props.placeholder} placeholderTextColor={theme.colors.muted} secureTextEntry={password && !visible} style={[styles.input, inputStyle]} />
      {password && <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Sembunyikan password' : 'Tampilkan password'} onPress={() => setVisible(value => !value)} hitSlop={10}><V3Icon name={registration ? 'eyeRegister' : 'eye'} /></Pressable>}
    </View>
    <Feedback message={error} />
  </View>;
}

export function Chips({ options, value, onChange, tone = 'primary' }) {
  const palette = {
    primary: [theme.colors.primary, theme.colors.surface, theme.colors.primary],
    success: [theme.colors.successSoft, theme.colors.success, theme.colors.success],
    warning: [theme.colors.warningSoft, theme.colors.warning, theme.colors.yellow],
    danger: [theme.colors.dangerSoft, theme.colors.danger, theme.colors.danger],
  }[tone];
  return <View style={styles.chips}>{options.map(option => {
    const key = typeof option === 'string' ? option : option.value;
    const label = typeof option === 'string' ? option : option.label;
    const selected = key === value;
    return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} aria-pressed={selected} key={key} onPress={() => onChange(key)} style={[styles.chip, selected && { backgroundColor: palette[0], borderColor: palette[2] }]}>
      <AppText variant="tinyStrong" color={selected ? palette[1] : theme.colors.text}>{label}</AppText>
    </Pressable>;
  })}</View>;
}

export function Badge({ children, tone = 'primary' }) {
  const palette = { primary: [theme.colors.soft, theme.colors.primary], success: [theme.colors.successSoft, theme.colors.success], warning: [theme.colors.warningSoft, theme.colors.warning], danger: [theme.colors.dangerSoft, theme.colors.danger] }[tone] || [theme.colors.soft, theme.colors.primary];
  return <View style={[styles.badge, { backgroundColor: palette[0] }]}><AppText variant="tinyStrong" color={palette[1]}>{children}</AppText></View>;
}

export function Notice({ title, detail, icon = 'shield', warning = false, gradient = false }) {
  const content = <><V3Icon name={icon} /><View style={styles.flex}><AppText variant="tinyStrong" color={warning ? theme.colors.text : theme.colors.primary}>{title}</AppText>{detail && <AppText variant="tiny" color={theme.colors.muted} style={{ marginTop: 5 }}>{detail}</AppText>}</View></>;
  const style = [styles.notice, { backgroundColor: warning ? theme.colors.warningSoft : theme.colors.soft }];
  return gradient ? <GradientCard colors={warning ? ['#FFF9EB', '#FFF0D9'] : ['#EDF2FF', '#F8FAFF']} style={style}>{content}</GradientCard> : <View style={style}>{content}</View>;
}

export function Feedback({ message, neutral = false }) {
  return message ? <AppText accessibilityLiveRegion="polite" variant="caption" color={neutral ? theme.colors.muted : theme.colors.danger}>{message}</AppText> : null;
}

export const layout = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  group: { gap: 10 },
  section: { gap: 12 },
  divider: { height: 1, backgroundColor: theme.colors.border },
});

const textVariants = StyleSheet.create({
  title: { fontFamily: theme.fonts.bold, fontSize: 21, lineHeight: 28, color: theme.colors.dark },
  heading: { fontFamily: theme.fonts.semibold, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: theme.fonts.regular, fontSize: 13, lineHeight: 20 },
  label: { fontFamily: theme.fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: theme.fonts.regular, fontSize: 12, lineHeight: 19 },
  tiny: { fontFamily: theme.fonts.regular, fontSize: 11, lineHeight: 17 },
  tinyStrong: { fontFamily: theme.fonts.semibold, fontSize: 11, lineHeight: 16 },
  button: { fontFamily: theme.fonts.semibold, fontSize: 14, lineHeight: 19 },
});

const styles = StyleSheet.create({
  text: { color: theme.colors.text, flexShrink: 1 },
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12, flexGrow: 1 },
  header: { gap: 4, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14, gap: 10, boxShadow: '0px 3px 11px rgba(23,46,98,0.05)' },
  gradient: { padding: 16, borderRadius: 16, overflow: 'hidden' },
  button: { minHeight: 48, borderRadius: 12, backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12 },
  buttonOutline: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  buttonSmall: { minHeight: 32, paddingVertical: 6, borderRadius: 9 },
  fieldGroup: { gap: 8 },
  inputRow: { minHeight: 49, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, minWidth: 0, minHeight: 47, paddingVertical: 12, color: theme.colors.text, fontSize: 13, fontFamily: theme.fonts.regular, outlineStyle: 'none' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, minWidth: 0, minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, alignSelf: 'flex-start' },
  notice: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, alignItems: 'flex-start' },
});

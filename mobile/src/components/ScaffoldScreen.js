import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export default function ScaffoldScreen({ title, description, children }) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.status}>Scaffold · fitur belum diimplementasikan</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.large,
    gap: theme.spacing.medium,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text,
  },
  status: {
    color: theme.colors.muted,
  },
});

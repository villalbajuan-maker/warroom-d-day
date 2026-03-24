import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const buttonStyle = [
    styles.button,
    variant === 'danger' && styles.dangerButton,
    variant === 'secondary' && styles.secondaryButton,
    (disabled || loading) && styles.disabledButton,
  ];

  const textStyle = [
    styles.text,
    variant === 'secondary' && styles.secondaryText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? Colors.text : Colors.background} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.text,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  dangerButton: {
    backgroundColor: Colors.critical,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.4,
  },
  text: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  secondaryText: {
    color: Colors.text,
  },
});

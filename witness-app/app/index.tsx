import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { useWitness } from '@/contexts/WitnessContext';
import { router } from 'expo-router';
import { authenticateByDocument } from '@/lib/auth-service';

export default function LoginScreen() {
  const { session, setSession, isLoading: contextLoading } = useWitness();
  const [documentNumber, setDocumentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!contextLoading && session) {
      router.replace('/(drawer)/home');
    }
  }, [session, contextLoading]);

  const handleLogin = async () => {
    setError('');

    if (!documentNumber.trim()) {
      setError('Ingresa tu número de documento');
      return;
    }

    setIsLoading(true);

    const result = await authenticateByDocument(documentNumber.trim());

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'No se pudo iniciar sesión');
      return;
    }

    if (result.session) {
      setSession(result.session);
      router.replace('/(drawer)/home');
    }
  };

  if (contextLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo />
        </View>

        <View style={styles.header}>
          <Text style={styles.subtitle}>Sistema de control electoral</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Número de documento</Text>
          <TextInput
            style={styles.input}
            value={documentNumber}
            onChangeText={setDocumentNumber}
            placeholder="Ingresa tu documento"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="numeric"
            autoFocus
            editable={!isLoading}
          />
          <Text style={styles.hint}>
            Ingresa el documento con el que fuiste registrado como testigo
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.buttonContainer}>
          <Button
            title="Ingresar"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!documentNumber.trim() || isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  header: {
    marginBottom: 64,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: 'rgba(179, 38, 30, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(179, 38, 30, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.critical,
    lineHeight: 19,
  },
  buttonContainer: {
    marginTop: 16,
  },
});

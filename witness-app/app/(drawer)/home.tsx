import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import { useWitness } from '@/contexts/WitnessContext';
import { Redirect, router } from 'expo-router';
import { CheckCircle2, AlertCircle, UserCheck, FileWarning, LogOut, Upload } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { session, updateStatus } = useWitness();
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasE14Uploaded, setHasE14Uploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;

    const checkPresenceStatus = async () => {
      console.log('[PRESENCE] Checking status for assignment:', session.assignment.id);

      const { data, error } = await supabase
        .from('presence_records')
        .select('id, checked_in_at')
        .eq('campaign_id', session.campaign_id)
        .eq('assignment_id', session.assignment.id)
        .maybeSingle();

      console.log('[PRESENCE] Status check result:', { data, error });

      setHasCheckedIn(!!data);
    };

    const checkE14Status = async () => {
      console.log('[E14] Checking if E14 uploaded for witness:', session.witness.id);

      const { data, error } = await supabase
        .from('evidence_records')
        .select('id')
        .eq('campaign_id', session.campaign_id)
        .eq('witness_id', session.witness.id)
        .eq('evidence_type', 'E14')
        .limit(1)
        .maybeSingle();

      console.log('[E14] Check result:', { data, error });

      setHasE14Uploaded(!!data);
    };

    checkPresenceStatus();
    checkE14Status();

    const interval = setInterval(() => {
      checkPresenceStatus();
      checkE14Status();
    }, 10000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return <Redirect href="/" />;
  }

  const handleConfirmPresence = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('¿Confirmas que estás presente en tu mesa asignada?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Confirmar presencia',
            '¿Confirmas que estás presente en tu mesa asignada?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Confirmar', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    setLoading(true);
    try {
      if (!session.campaign_id || !session.assignment?.id || !session.polling_table?.id || !session.witness?.id) {
        console.error('[PRESENCE] Missing required data:', {
          campaign_id: session.campaign_id,
          assignment_id: session.assignment?.id,
          polling_table_id: session.polling_table?.id,
          witness_id: session.witness?.id,
        });
        throw new Error('Datos incompletos para confirmar presencia');
      }

      const now = new Date().toISOString();

      const presenceData = {
        campaign_id: session.campaign_id,
        assignment_id: session.assignment.id,
        checked_in_at: now,
      };

      console.log('[PRESENCE] Inserting presence record:', presenceData);

      const { data: presenceResult, error: presenceError } = await supabase
        .from('presence_records')
        .insert(presenceData)
        .select();

      console.log('[PRESENCE] Insert result:', { data: presenceResult, error: presenceError });

      if (presenceError) throw presenceError;

      const eventData = {
        campaign_id: session.campaign_id,
        event_type: 'CHECK_IN',
        scheduled_at: now,
        polling_table_id: session.polling_table.id,
        witness_id: session.witness.id,
        payload: {
          municipality: session.municipality.name,
          polling_place: session.polling_place.name,
          table_number: session.polling_table.table_number,
        },
      };

      const { error: eventError } = await supabase
        .from('demo_timeline_events')
        .insert(eventData);

      if (eventError) throw eventError;

      updateStatus('present');
      setHasCheckedIn(true);

      if (Platform.OS === 'web') {
        window.alert('Presencia confirmada: Tu presencia ha sido registrada correctamente');
      } else {
        Alert.alert('Presencia confirmada', 'Tu presencia ha sido registrada correctamente');
      }
    } catch (error: any) {
      console.error('[PRESENCE] Error confirming presence:', error);
      console.error('[PRESENCE] Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });

      const errorMessage = error?.message || 'No se pudo registrar tu presencia. Intenta nuevamente.';

      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!hasE14Uploaded) {
      if (Platform.OS === 'web') {
        window.alert('Debes cargar los formularios E14 antes de finalizar tu jornada.');
      } else {
        Alert.alert(
          'E14 requeridos',
          'Debes cargar los formularios E14 antes de finalizar tu jornada.',
          [{ text: 'Entendido' }]
        );
      }
      return;
    }

    const confirmed = Platform.OS === 'web'
      ? window.confirm('Esto registrará tu retiro personal. No cierra la mesa.\n\n¿Estás seguro?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Registrar salida',
            'Esto registrará tu retiro personal. No cierra la mesa.\n\n¿Estás seguro?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Confirmar', style: 'default', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();

      console.log('[PRESENCE] Looking for presence record for assignment:', session.assignment.id);

      const { data: presenceRecord, error: findError } = await supabase
        .from('presence_records')
        .select('id')
        .eq('campaign_id', session.campaign_id)
        .eq('assignment_id', session.assignment.id)
        .maybeSingle();

      console.log('[PRESENCE] Found record:', { presenceRecord, findError });

      if (presenceRecord) {
        const { data: updateResult, error: updateError } = await supabase
          .from('presence_records')
          .update({ checked_out_at: now })
          .eq('id', presenceRecord.id)
          .select();

        console.log('[PRESENCE] Update result:', { updateResult, updateError });

        if (updateError) throw updateError;
      }

      const eventData = {
        campaign_id: session.campaign_id,
        event_type: 'CHECK_OUT',
        scheduled_at: now,
        polling_table_id: session.polling_table.id,
        witness_id: session.witness.id,
        payload: {
          municipality: session.municipality.name,
          polling_place: session.polling_place.name,
          table_number: session.polling_table.table_number,
        },
      };

      await supabase.from('demo_timeline_events').insert(eventData);

      if (Platform.OS === 'web') {
        window.alert('Salida registrada: Tu salida ha sido registrada correctamente');
      } else {
        Alert.alert('Salida registrada', 'Tu salida ha sido registrada correctamente');
      }
    } catch (error: any) {
      console.error('[PRESENCE] Error registering checkout:', error);
      console.error('[PRESENCE] Checkout error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });

      const errorMessage = error?.message || 'No se pudo registrar tu salida. Intenta nuevamente.';

      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const tableNumber = session.polling_table.table_number;
  const pollingPlace = session.polling_place.name;
  const municipality = session.municipality.name;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Estado</Text>

        {hasCheckedIn ? (
          <View style={styles.statusActive}>
            <CheckCircle2 size={22} color={Colors.success} strokeWidth={2} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Presencia confirmada</Text>
              <Text style={styles.statusSubtitle}>Registro activo</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statusInactive}>
            <AlertCircle size={22} color={Colors.textSecondary} strokeWidth={2} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Sin confirmar</Text>
              <Text style={styles.statusSubtitle}>Confirma tu presencia en mesa</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Mesa asignada</Text>
        <Text style={styles.cardValue}>Mesa {tableNumber}</Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardRow}>
          <Text style={styles.cardRowLabel}>Puesto de votación</Text>
          <Text style={styles.cardRowValue}>{pollingPlace}</Text>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardRowLabel}>Municipio</Text>
          <Text style={styles.cardRowValue}>{municipality}</Text>
        </View>
      </View>

      {!hasCheckedIn && (
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleConfirmPresence}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <>
              <UserCheck size={18} color={Colors.text} strokeWidth={2} />
              <Text style={styles.primaryButtonText}>Confirmar presencia</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/(drawer)/report-incident')}
        activeOpacity={0.8}
      >
        <FileWarning size={18} color={Colors.critical} strokeWidth={2} />
        <Text style={styles.secondaryButtonText}>Reportar incidencia</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.uploadE14Button,
          hasE14Uploaded && styles.uploadE14ButtonComplete,
        ]}
        onPress={() => router.push('/(drawer)/upload-e14')}
        activeOpacity={0.8}
      >
        <Upload size={18} color={hasE14Uploaded ? Colors.success : Colors.primary} strokeWidth={2} />
        <Text
          style={[
            styles.uploadE14ButtonText,
            hasE14Uploaded && styles.uploadE14ButtonTextComplete,
          ]}
        >
          {hasE14Uploaded ? 'E14 enviados ✓' : 'Subir Formularios E14'}
        </Text>
      </TouchableOpacity>

      {hasCheckedIn && !hasE14Uploaded && (
        <View style={styles.warningBox}>
          <AlertCircle size={16} color={Colors.warning} strokeWidth={2} />
          <Text style={styles.warningText}>
            Debes cargar los formularios E14 antes de finalizar tu jornada
          </Text>
        </View>
      )}

      {hasCheckedIn && (
        <TouchableOpacity
          style={[
            styles.tertiaryButton,
            (loading || !hasE14Uploaded) && styles.buttonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={loading || !hasE14Uploaded}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.textSecondary} />
          ) : (
            <>
              <LogOut size={16} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.tertiaryButtonText}>Registrar mi salida</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Toda incidencia debe estar acompañada de evidencia fotográfica
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  statusCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 32,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  statusActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  statusSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 32,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardRowLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  cardRowValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  primaryButton: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.critical,
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.critical,
    letterSpacing: -0.2,
  },
  uploadE14Button: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 16,
  },
  uploadE14ButtonComplete: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderColor: Colors.success,
  },
  uploadE14ButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  uploadE14ButtonTextComplete: {
    color: Colors.success,
  },
  warningBox: {
    backgroundColor: 'rgba(166, 138, 0, 0.1)',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 32,
  },
  tertiaryButtonText: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  infoBox: {
    backgroundColor: 'rgba(43, 108, 176, 0.08)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});

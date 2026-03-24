import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { Clock, Menu } from 'lucide-react-native';
import { Logo } from './Logo';
import { useWitness } from '@/contexts/WitnessContext';
import { getSimulationState, formatSimulatedTime, SimulationState } from '@/lib/simulation-service';

interface WitnessHeaderProps {
  onMenuPress?: () => void;
}

export function WitnessHeader({ onMenuPress }: WitnessHeaderProps) {
  const { session } = useWitness();
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);

  useEffect(() => {
    if (!session) return;

    const loadSimulation = async () => {
      const state = await getSimulationState(session.campaign_id);
      if (state) {
        setSimulationState(state);
      }
    };

    loadSimulation();
    const interval = setInterval(loadSimulation, 5000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Logo size="small" />
        <View style={styles.timeContainer}>
          <Clock size={14} color={Colors.text} strokeWidth={2} />
          <Text style={styles.timeText}>{formatSimulatedTime(simulationState)}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.witnessInfo}>
          <Text style={styles.witnessName}>{session.witness.full_name}</Text>
          <Text style={styles.tableName}>
            Mesa {session.polling_table.table_number} · {session.municipality.name}
          </Text>
        </View>
        {onMenuPress && (
          <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
            <Menu size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  witnessInfo: {
    flex: 1,
  },
  witnessName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  tableName: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  menuButton: {
    padding: 8,
    marginTop: -4,
  },
});

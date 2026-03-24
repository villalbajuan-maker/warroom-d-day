import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import { useWitness } from '@/contexts/WitnessContext';
import { supabase } from '@/lib/supabase';
import { Redirect, router } from 'expo-router';
import { CheckCircle2, AlertTriangle, Camera, LogOut, FileText } from 'lucide-react-native';

interface ActivityEvent {
  id: string;
  event_type: string;
  scheduled_at: string;
  payload: any;
}

export default function MyActivityScreen() {
  const { session } = useWitness();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    loadActivities();
  }, [session]);

  const loadActivities = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('demo_timeline_events')
        .select('*')
        .eq('witness_id', session.witness.id)
        .eq('campaign_id', session.campaign_id)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <Redirect href="/" />;
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CHECK_IN':
        return CheckCircle2;
      case 'CHECK_OUT':
        return LogOut;
      case 'INCIDENT':
        return AlertTriangle;
      case 'EVIDENCE':
        return Camera;
      default:
        return FileText;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'CHECK_IN':
        return 'Presencia confirmada';
      case 'CHECK_OUT':
        return 'Salida registrada';
      case 'INCIDENT':
        return 'Incidencia reportada';
      case 'EVIDENCE':
        return 'Evidencia capturada';
      default:
        return 'Evento';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'CHECK_IN':
        return Colors.success;
      case 'CHECK_OUT':
        return Colors.textSecondary;
      case 'INCIDENT':
        return Colors.critical;
      case 'EVIDENCE':
        return Colors.primary;
      default:
        return Colors.textSecondary;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('es', { month: 'short' });
    return `${day} ${month}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <FileText size={40} color={Colors.textTertiary} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Sin actividad</Text>
          <Text style={styles.emptyText}>
            Tus acciones se registrarán aquí
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {activities.map((activity, index) => {
            const EventIcon = getEventIcon(activity.event_type);
            const eventColor = getEventColor(activity.event_type);
            const isLast = index === activities.length - 1;

            return (
              <View key={activity.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: eventColor }]}>
                    <EventIcon size={13} color={Colors.background} strokeWidth={2.5} />
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{getEventLabel(activity.event_type)}</Text>
                      <Text style={styles.eventTime}>{formatTime(activity.scheduled_at)}</Text>
                    </View>

                    {activity.payload?.description && (
                      <Text style={styles.eventDescription} numberOfLines={2}>
                        {activity.payload.description}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
  timeline: {
    paddingTop: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 4,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.border,
    marginTop: 12,
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  eventCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
    letterSpacing: -0.2,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textTertiary,
    marginLeft: 12,
    fontVariant: ['tabular-nums'],
  },
  eventDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: 8,
  },
});

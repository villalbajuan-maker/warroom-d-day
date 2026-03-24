import { Drawer } from 'expo-router/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Colors } from '@/constants/colors';
import { Home, FileWarning, Activity, LogOut, Upload } from 'lucide-react-native';
import { useWitness } from '@/contexts/WitnessContext';
import { Logo } from '@/components/Logo';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { getSimulationState, formatSimulatedTime, SimulationState } from '@/lib/simulation-service';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { session, logout } = useWitness();
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

  const handleLogout = () => {
    const confirmed = confirm('¿Confirmas que deseas salir de la aplicación?');
    if (confirmed) {
      logout();
      router.replace('/');
    }
  };

  if (!session) return null;

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Logo size="small" />
        </View>

        <View style={styles.witnessInfo}>
          <Text style={styles.witnessLabel}>Testigo</Text>
          <Text style={styles.witnessName}>{session.witness.full_name}</Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mesa</Text>
            <Text style={styles.infoValue}>{session.polling_table.table_number}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hora</Text>
            <Text style={styles.infoValue}>{formatSimulatedTime(simulationState)}</Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView {...props} style={styles.drawerScroll} contentContainerStyle={styles.drawerScrollContent}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.footerSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={Colors.critical} strokeWidth={2} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.backgroundElevated,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 16,
        },
        drawerStyle: {
          backgroundColor: Colors.drawerBackground,
          width: 280,
        },
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerLabelStyle: {
          fontWeight: '500',
          fontSize: 15,
          marginLeft: -16,
        },
        drawerItemStyle: {
          marginVertical: 2,
          marginHorizontal: 12,
          borderRadius: 8,
          paddingVertical: 2,
        },
        drawerActiveBackgroundColor: Colors.primary + '15',
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }) => (
            <Home size={20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Drawer.Screen
        name="report-incident"
        options={{
          title: 'Reportar incidencia',
          drawerIcon: ({ color, size }) => (
            <FileWarning size={20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Drawer.Screen
        name="upload-e14"
        options={{
          title: 'Subir Formularios E14',
          drawerIcon: ({ color, size }) => (
            <Upload size={20} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Drawer.Screen
        name="my-activity"
        options={{
          title: 'Mi actividad',
          drawerIcon: ({ color, size }) => (
            <Activity size={20} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: Colors.drawerBackground,
  },
  headerSection: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: Colors.drawerBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.drawerBorder,
  },
  logoContainer: {
    marginBottom: 20,
  },
  witnessInfo: {
    gap: 12,
  },
  witnessLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  witnessName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  drawerScroll: {
    flex: 1,
    paddingTop: 16,
  },
  drawerScrollContent: {
    paddingBottom: 16,
  },
  footerSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.drawerBorder,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.critical,
  },
});

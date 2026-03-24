import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useWitness } from '@/contexts/WitnessContext';
import { Redirect, router } from 'expo-router';
import { Camera, Upload, Trash2, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface CapturedE14 {
  id: string;
  uri: string;
  width: number;
  height: number;
  timestamp: number;
}

export default function UploadE14Screen() {
  const { session } = useWitness();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [e14Files, setE14Files] = useState<CapturedE14[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  if (!session) {
    return <Redirect href="/" />;
  }

  const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleOpenCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        if (Platform.OS === 'web') {
          window.alert('Se requiere permiso de cámara para capturar formularios E14');
        } else {
          Alert.alert('Permiso requerido', 'Se requiere permiso de cámara para capturar formularios E14');
        }
        return;
      }
    }
    setShowCamera(true);
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo) {
        const newE14: CapturedE14 = {
          id: generateId(),
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          timestamp: Date.now(),
        };
        setE14Files((prev) => [...prev, newE14]);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('[E14] Failed to capture photo:', error);
      if (Platform.OS === 'web') {
        window.alert('No se pudo capturar la foto. Intenta nuevamente.');
      } else {
        Alert.alert('Error', 'No se pudo capturar la foto. Intenta nuevamente.');
      }
    }
  };

  const handleRemoveE14 = (id: string) => {
    if (uploadComplete) return;

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('¿Deseas eliminar esta foto?')
        : false;

    if (Platform.OS !== 'web') {
      Alert.alert('Eliminar foto', '¿Deseas eliminar esta foto?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setE14Files((prev) => prev.filter((file) => file.id !== id));
          },
        },
      ]);
      return;
    }

    if (confirmed) {
      setE14Files((prev) => prev.filter((file) => file.id !== id));
    }
  };

  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  const handleUploadAll = async () => {
    if (e14Files.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('No hay formularios E14 capturados');
      } else {
        Alert.alert('Sin formularios', 'No hay formularios E14 capturados');
      }
      return;
    }

    const confirmMessage = `¿Confirmas que ya cargaste todos los formularios E14 de tu mesa?\n\nTotal a enviar: ${e14Files.length} formulario(s)`;

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(confirmMessage)
        : await new Promise((resolve) => {
            Alert.alert('Confirmar envío', confirmMessage, [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Confirmar', onPress: () => resolve(true) },
            ]);
          });

    if (!confirmed) return;

    setUploading(true);

    try {
      const now = new Date().toISOString();
      let successCount = 0;

      for (const file of e14Files) {
        try {
          const evidenceId = generateId();
          const fileName = `${evidenceId}.jpg`;
          const storagePath = `campaigns/${session.campaign_id}/tables/${session.polling_table.id}/e14/${fileName}`;

          const blob = await uriToBlob(file.uri);
          const fileSize = blob.size;

          const { error: uploadError } = await supabase.storage
            .from('warroom-evidence')
            .upload(storagePath, blob, {
              contentType: 'image/jpeg',
              upsert: false,
            });

          if (uploadError) {
            console.error('[E14] Upload failed:', uploadError);
            throw uploadError;
          }

          const evidenceData = {
            campaign_id: session.campaign_id,
            polling_table_id: session.polling_table.id,
            witness_id: session.witness.id,
            evidence_type: 'E14',
            file_uri: storagePath,
            file_mime_type: 'image/jpeg',
            file_size_bytes: fileSize,
            file_hash: '',
            captured_at: now,
          };

          const { error: insertError } = await supabase
            .from('evidence_records')
            .insert(evidenceData);

          if (insertError) {
            console.error('[E14] Insert failed:', insertError);
            throw insertError;
          }

          successCount++;
          console.log(`[E14] Uploaded ${successCount}/${e14Files.length}`);
        } catch (error) {
          console.error('[E14] Error processing file:', error);
          throw error;
        }
      }

      setUploadComplete(true);

      if (Platform.OS === 'web') {
        window.alert(`E14 enviados correctamente: ${successCount} formulario(s) enviado(s) con éxito`);
      } else {
        Alert.alert(
          'E14 enviados correctamente',
          `${successCount} formulario(s) enviado(s) con éxito`
        );
      }
    } catch (error: any) {
      console.error('[E14] Upload batch failed:', error);
      const errorMessage =
        error?.message || 'No se pudieron enviar los formularios E14. Intenta nuevamente.';

      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraCancelButton}
              onPress={() => setShowCamera(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cameraButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraCaptureButton}
              onPress={handleCapturePhoto}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  const tableNumber = session.polling_table.table_number;
  const municipality = session.municipality.name;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Formularios E14</Text>
          <Text style={styles.headerSubtitle}>
            Mesa {tableNumber} • {municipality}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>E14 capturados</Text>
            <Text style={styles.statusValue}>{e14Files.length}</Text>
          </View>
          {e14Files.length > 0 && (
            <View style={styles.progressBar}>
              <View style={styles.progressBarFill} />
            </View>
          )}
        </View>

        {!uploadComplete && (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleOpenCamera}
            activeOpacity={0.8}
          >
            <Camera size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.captureButtonText}>Capturar nuevo E14</Text>
          </TouchableOpacity>
        )}

        {uploadComplete && (
          <View style={styles.successCard}>
            <CheckCircle2 size={24} color={Colors.success} strokeWidth={2} />
            <Text style={styles.successTitle}>E14 enviados correctamente</Text>
            <Text style={styles.successSubtitle}>
              Total enviado: {e14Files.length} formulario(s)
            </Text>
          </View>
        )}

        {e14Files.length > 0 && (
          <View style={styles.filesSection}>
            <Text style={styles.filesSectionTitle}>Imágenes capturadas</Text>
            {e14Files.map((file, index) => (
              <View key={file.id} style={styles.fileCard}>
                <View style={styles.filePreview}>
                  <Image source={{ uri: file.uri }} style={styles.fileImage} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>E14 #{index + 1}</Text>
                  <Text style={styles.fileTimestamp}>
                    {new Date(file.timestamp).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {!uploadComplete && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveE14(file.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color={Colors.critical} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {e14Files.length > 0 && !uploadComplete && (
        <View style={styles.footerSection}>
          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={handleUploadAll}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <View style={styles.uploadButtonLoading}>
                <ActivityIndicator size="small" color={Colors.text} />
                <Text style={styles.uploadButtonText}>Enviando E14...</Text>
              </View>
            ) : (
              <>
                <Upload size={20} color={Colors.text} strokeWidth={2} />
                <Text style={styles.uploadButtonText}>
                  Enviar todos los E14 ({e14Files.length})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 32,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  statusValue: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: -1.5,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    width: '100%',
  },
  captureButton: {
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
    marginBottom: 32,
  },
  captureButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  successCard: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.3)',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  filesSection: {
    marginBottom: 24,
  },
  filesSectionTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  fileCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filePreview: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fileImage: {
    width: '100%',
    height: '100%',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  fileTimestamp: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  removeButton: {
    padding: 10,
  },
  footerSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadButtonDisabled: {
    opacity: 0.4,
  },
  uploadButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  cameraCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  cameraCaptureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.text,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.text,
  },
});

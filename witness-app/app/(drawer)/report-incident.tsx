import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useWitness } from '@/contexts/WitnessContext';
import { Redirect, router } from 'expo-router';
import { INCIDENT_CATEGORIES, IncidentCategory, IncidentType } from '@/types/witness';
import { supabase } from '@/lib/supabase';
import { Camera, AlertCircle, ChevronDown, CheckCircle2, X, RotateCcw } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

export default function ReportIncidentScreen() {
  const { session } = useWitness();
  const cameraRef = useRef<CameraView>(null);
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentType | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<CapturedPhoto | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);

  if (!session) {
    return <Redirect href="/" />;
  }

  const handleCategorySelect = (category: IncidentCategory) => {
    setSelectedCategory(category);
    setSelectedIncident(null);
    setShowCategoryDropdown(false);
  };

  const handleIncidentSelect = (incident: IncidentType) => {
    setSelectedIncident(incident);
    setShowIncidentDropdown(false);
  };

  const isUncataloged =
    selectedIncident?.value.includes('_other') || false;

  const requiresEvidence = selectedIncident?.requiresEvidence || false;

  const canSubmit = () => {
    if (!selectedCategory || !selectedIncident) return false;
    if (isUncataloged && !customDescription.trim()) return false;
    if (requiresEvidence && !uploadedFilePath) return false;
    return true;
  };

  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  const generateEvidenceId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setSubmitting(true);

    try {
      const now = new Date().toISOString();

      const incidentData = {
        campaign_id: session.campaign_id,
        polling_table_id: session.polling_table.id,
        witness_id: session.witness.id,
        canonical_type: selectedCategory!.value,
        canonical_subtype: selectedIncident!.value,
        severity: selectedIncident!.severity,
        description: isUncataloged ? customDescription : selectedIncident!.label,
        occurred_at: now,
      };

      const { data: incident, error: incidentError } = await supabase
        .from('incident_records')
        .insert(incidentData)
        .select()
        .single();

      if (incidentError) throw incidentError;

      if (uploadedFilePath) {
        const evidenceData = {
          campaign_id: session.campaign_id,
          polling_table_id: session.polling_table.id,
          witness_id: session.witness.id,
          evidence_type: 'photo',
          file_uri: uploadedFilePath,
          file_mime_type: 'image/jpeg',
          file_size_bytes: uploadedFileSize,
          file_hash: '',
          captured_at: now,
          related_incident_id: incident.id,
        };

        const { error: evidenceError } = await supabase
          .from('evidence_records')
          .insert(evidenceData);

        if (evidenceError) throw evidenceError;
      }

      const eventData = {
        campaign_id: session.campaign_id,
        event_type: 'INCIDENT',
        scheduled_at: now,
        polling_table_id: session.polling_table.id,
        witness_id: session.witness.id,
        payload: {
          incident_type: selectedIncident!.value,
          category: selectedCategory!.value,
          description: incidentData.description,
        },
      };

      await supabase.from('demo_timeline_events').insert(eventData);

      if (Platform.OS === 'web') {
        window.alert('Incidencia reportada correctamente');
        router.back();
      } else {
        Alert.alert(
          'Incidencia reportada',
          'Tu reporte ha sido enviado correctamente',
          [
            {
              text: 'Entendido',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error submitting incident:', error);
      const errorMessage = error?.message || 'No se pudo enviar la incidencia. Intenta nuevamente.';

      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para capturar evidencia');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleRetakePhoto = () => {
    setPhotoUri(null);
    setPhotoData(null);
    setUploadedFilePath(null);
    setUploadedFileSize(0);
    setShowCamera(true);
  };

  const handleConfirmPhoto = async () => {
    if (!photoUri || !photoData || uploadingEvidence) return;

    setUploadingEvidence(true);

    try {
      const evidenceId = generateEvidenceId();
      const fileName = `${evidenceId}.jpg`;
      const storagePath = `campaigns/${session.campaign_id}/tables/${session.polling_table.id}/evidence/${fileName}`;

      const blob = await uriToBlob(photoUri);
      const fileSize = blob.size;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('warroom-evidence')
        .upload(storagePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadedFilePath(storagePath);
      setUploadedFileSize(fileSize);
      console.log('[EVIDENCE] Uploaded to:', storagePath);

      if (Platform.OS === 'web') {
        window.alert('Evidencia confirmada correctamente');
      } else {
        Alert.alert('Evidencia confirmada', 'La foto ha sido confirmada. Ahora puedes enviar tu reporte.');
      }
    } catch (error: any) {
      console.error('[EVIDENCE] Upload failed:', error);
      const errorMessage = error?.message || 'No se pudo subir la evidencia. Verifica tu conexión e intenta nuevamente.';

      if (Platform.OS === 'web') {
        window.alert('Error: ' + errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo) {
        setPhotoUri(photo.uri);
        setPhotoData({
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
        });
        setShowCamera(false);
      }
    } catch (error) {
      console.error('[CAMERA] Failed to capture photo:', error);
      if (Platform.OS === 'web') {
        window.alert('No se pudo capturar la foto. Intenta nuevamente.');
      } else {
        Alert.alert('Error', 'No se pudo capturar la foto. Intenta nuevamente.');
      }
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Categoría</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownText, !selectedCategory && styles.dropdownPlaceholder]}>
            {selectedCategory ? selectedCategory.label : 'Selecciona una categoría'}
          </Text>
          <ChevronDown size={16} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        {showCategoryDropdown && (
          <View style={styles.dropdownList}>
            {INCIDENT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.dropdownItem}
                onPress={() => handleCategorySelect(category)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownItemText}>{category.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedCategory && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Incidencia</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowIncidentDropdown(!showIncidentDropdown)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, !selectedIncident && styles.dropdownPlaceholder]}>
              {selectedIncident ? selectedIncident.label : 'Selecciona el tipo específico'}
            </Text>
            <ChevronDown size={16} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          {showIncidentDropdown && (
            <View style={styles.dropdownList}>
              {selectedCategory.incidents.map((incident) => (
                <TouchableOpacity
                  key={incident.id}
                  style={styles.dropdownItem}
                  onPress={() => handleIncidentSelect(incident)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>{incident.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {isUncataloged && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Descripción</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe la incidencia brevemente"
            placeholderTextColor={Colors.textTertiary}
            value={customDescription}
            onChangeText={setCustomDescription}
            maxLength={240}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{customDescription.length} / 240</Text>
        </View>
      )}

      {requiresEvidence && selectedIncident && (
        <View style={styles.section}>
          <View style={styles.evidenceHeader}>
            <AlertCircle size={15} color={Colors.warning} strokeWidth={2} />
            <Text style={styles.evidenceLabel}>Evidencia obligatoria</Text>
          </View>

          <Text style={styles.evidenceHint}>Esta evidencia protege tu reporte</Text>

          {!photoUri ? (
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
            >
              <Camera size={18} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.photoButtonText}>Capturar evidencia</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: photoUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              {!uploadedFilePath ? (
                <View style={styles.previewActionsColumn}>
                  <View style={styles.previewStatus}>
                    <AlertCircle size={16} color={Colors.warning} strokeWidth={2} />
                    <Text style={styles.previewStatusPending}>Pendiente de confirmar</Text>
                  </View>
                  <View style={styles.previewButtonsRow}>
                    <TouchableOpacity
                      style={styles.retakeButtonSecondary}
                      onPress={handleRetakePhoto}
                      activeOpacity={0.8}
                    >
                      <RotateCcw size={16} color={Colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.retakeButtonTextSecondary}>Repetir foto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmButton, uploadingEvidence && styles.confirmButtonDisabled]}
                      onPress={handleConfirmPhoto}
                      disabled={uploadingEvidence}
                      activeOpacity={0.8}
                    >
                      {uploadingEvidence ? (
                        <>
                          <ActivityIndicator size="small" color={Colors.text} />
                          <Text style={styles.confirmButtonText}>Subiendo...</Text>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} color={Colors.text} strokeWidth={2} />
                          <Text style={styles.confirmButtonText}>Confirmar envío</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.previewActions}>
                  <View style={styles.previewStatus}>
                    <CheckCircle2 size={16} color={Colors.success} strokeWidth={2} />
                    <Text style={styles.previewStatusText}>Evidencia confirmada</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={handleRetakePhoto}
                    activeOpacity={0.8}
                  >
                    <RotateCcw size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.retakeButtonText}>Cambiar foto</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit() || submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <View style={styles.submitButtonLoading}>
            <ActivityIndicator size="small" color={Colors.text} />
            <Text style={styles.submitButtonText}>Enviando incidencia...</Text>
          </View>
        ) : (
          <Text style={[styles.submitButtonText, !canSubmit() && styles.submitButtonTextDisabled]}>
            Enviar incidencia
          </Text>
        )}
      </TouchableOpacity>

      {!canSubmit() && selectedIncident && requiresEvidence && !photoUri && (
        <View style={styles.helpBox}>
          <Text style={styles.helpText}>Captura evidencia fotográfica para continuar</Text>
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
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  dropdownPlaceholder: {
    color: Colors.textTertiary,
  },
  dropdownList: {
    marginTop: 10,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text,
    minHeight: 100,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 8,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  evidenceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.warning,
    letterSpacing: -0.2,
  },
  evidenceHint: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  photoButtonSuccess: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  photoButtonTextSuccess: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.success,
    letterSpacing: -0.2,
  },
  previewContainer: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.inputBackground,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  previewStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewStatusText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.success,
    letterSpacing: -0.2,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  retakeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  previewActionsColumn: {
    padding: 12,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  previewStatusPending: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.warning,
    letterSpacing: -0.2,
  },
  previewButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  retakeButtonTextSecondary: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  submitButton: {
    backgroundColor: Colors.critical,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.disabled,
    opacity: 0.4,
  },
  submitButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  submitButtonTextDisabled: {
    color: Colors.disabledText,
  },
  helpBox: {
    marginTop: 16,
    backgroundColor: 'rgba(43, 108, 176, 0.08)',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  helpText: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 40,
  },
  cameraCancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  cameraButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  cameraCaptureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.critical,
  },
});

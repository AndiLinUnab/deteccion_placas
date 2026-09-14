import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

// Ajusta la dirección IPv4 de tu máquina local
const API_URL = "http://192.168.1.46:8000/detect-plate";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.permissionText}>Se requieren permisos de cámara para la inspección ALPR</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Otorgar Acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const captureAndScan = async () => {
    if (cameraRef.current && !loading) {
      try {
        setLoading(true);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });

        const formData = new FormData();
        const fileData = {
          uri: photo.uri.startsWith('file://') ? photo.uri : `file://${photo.uri}`,
          name: 'scan_image.jpg',
          type: 'image/jpeg',
        };
        formData.append('file', fileData as any);

        const response = await axios.post(API_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10000,
        });

        setResult(response.data);
      } catch (error: any) {
        Alert.alert("Fallo de Comunicación", "No se logró conectar con el nodo backend en el puerto 8000.");
      } finally {
        setLoading(false);
      }
    }
  };

  const resetScanner = () => {
    setResult(null);
  };

  return (
    <View style={styles.container}>
      {/* Barra de Estado Superior / Header Técnico */}
      <View style={styles.topBar}>
        <View style={styles.statusPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusLabel}>ALPR ENGINE ACTIVE</Text>
        </View>
        <Text style={styles.nodeText}>NODE: 192.168.1.15</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Frame de Cámara con Esquinas Cyan Neón */}
        <View style={styles.viewportContainer}>
          <CameraView style={styles.camera} ref={cameraRef}>
            <View style={styles.scanOverlay}>
              <View style={styles.reticle}>
                <View style={[styles.cornerBracket, styles.tl]} />
                <View style={[styles.cornerBracket, styles.tr]} />
                <View style={[styles.cornerBracket, styles.bl]} />
                <View style={[styles.cornerBracket, styles.br]} />
              </View>
            </View>
          </CameraView>
        </View>

        {/* Muestra de Placa Detectada con Estilo Cyan Neón */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.sectionTitle}>MATRÍCULA RECONOCIDA</Text>
            <View style={styles.plateBadge}>
              <Text style={styles.plateCode}>
                {result.placa_detectada !== "NO DETECTADA" ? result.placa_detectada : "--- ---"}
              </Text>
            </View>
          </View>
        )}

        {/* Informe del Vehículo (Layout Slate & Emerald) */}
        {result && result.placa_detectada !== "NO DETECTADA" && (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>Historial del Vehículo</Text>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>SISTEMA V1.0</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>EVALUACIÓN SOAT</Text>
                <Text style={styles.gridValueAlert}>VENCIDO (AUG 2026)</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>TÉCNICO-MECÁNICA</Text>
                <Text style={styles.gridValueAlert}>VENCIDO (AUG 2025)</Text>
              </View>
            </View>

            <View style={styles.alertDetailBox}>
              <Text style={styles.alertHeader}>Comparendo Registrado</Text>
              <Text style={styles.alertBody}>D07 - Impago en Tránsito Bucaramanga</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Barra de Controles Inferiores */}
      <View style={styles.footerBar}>
        <TouchableOpacity style={styles.btnSecondary} onPress={resetScanner}>
          <Text style={styles.btnSecondaryText}>RESETEAR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.triggerOuter} 
          onPress={captureAndScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#00F2FE" />
          ) : (
            <View style={styles.triggerInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimaryCyan} onPress={captureAndScan}>
          <Text style={styles.btnPrimaryText}>ESCANEAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19', paddingTop: 45 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161F30', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#00F2FE' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00F2FE', marginRight: 8 },
  statusLabel: { color: '#00F2FE', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  nodeText: { color: '#4A5568', fontSize: 11, fontFamily: 'monospace' },
  content: { paddingHorizontal: 18, paddingBottom: 110 },
  viewportContainer: { height: 210, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#1E293B', marginBottom: 18 },
  camera: { flex: 1 },
  scanOverlay: { flex: 1, backgroundColor: 'rgba(11, 15, 25, 0.35)', justifyContent: 'center', alignItems: 'center' },
  reticle: { width: 230, height: 100, position: 'relative' },
  cornerBracket: { position: 'absolute', width: 22, height: 22, borderColor: '#00F2FE' },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  resultCard: { backgroundColor: '#111827', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937', marginBottom: 16 },
  sectionTitle: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  plateBadge: { backgroundColor: '#00F2FE', paddingHorizontal: 32, paddingVertical: 8, borderRadius: 6 },
  plateCode: { fontSize: 30, fontWeight: '900', letterSpacing: 4, color: '#0B0F19', fontFamily: 'monospace' },
  reportCard: { backgroundColor: '#111827', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#1F2937' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  reportTitle: { color: '#F3F4F6', fontSize: 15, fontWeight: '700' },
  tagBadge: { backgroundColor: '#064E3B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tagText: { color: '#34D399', fontSize: 10, fontWeight: '700' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  gridItem: { width: '48%', backgroundColor: '#1F2937', padding: 10, borderRadius: 8 },
  gridLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '600' },
  gridValueAlert: { color: '#EF4444', fontSize: 11, fontWeight: '700', marginTop: 4 },
  alertDetailBox: { backgroundColor: '#1F2937', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  alertHeader: { color: '#F9FAFB', fontSize: 13, fontWeight: '700' },
  alertBody: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  footerBar: { position: 'absolute', bottom: 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 20 },
  triggerOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#00F2FE', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 242, 254, 0.05)' },
  triggerInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#00F2FE' },
  btnSecondary: { backgroundColor: '#1F2937', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  btnSecondaryText: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  btnPrimaryCyan: { backgroundColor: '#161F30', borderWidth: 1, borderColor: '#00F2FE', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  btnPrimaryText: { color: '#00F2FE', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  permissionText: { color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },
  primaryBtn: { backgroundColor: '#00F2FE', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  primaryBtnText: { color: '#0B0F19', fontWeight: '800' }
});
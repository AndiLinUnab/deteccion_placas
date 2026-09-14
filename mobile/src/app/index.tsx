import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

// ⚠️ Ajusta la IP local IPv4 de tu PC
const API_URL = "http://192.168.1.50:8000/detect-plate";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) return <View style={styles.darkBackground} />;
  
  if (!permission.granted) {
    return (
      <View style={[styles.darkBackground, styles.center]}>
        <Text style={styles.permissionText}>Se requiere acceso a la cámara para escanear placas</Text>
        <TouchableOpacity style={styles.accentButton} onPress={requestPermission}>
          <Text style={styles.btnText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Capturar foto desde el stream de la cámara y enviarla al servidor
  const takePictureAndProcess = async () => {
    if (cameraRef.current && !loading) {
      try {
        setLoading(true);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        setCapturedUri(photo.uri);

        // Formatear FormData de forma segura para evitar el bucle infinito de red
        const formData = new FormData();
        const fileData = {
          uri: photo.uri.startsWith('file://') ? photo.uri : `file://${photo.uri}`,
          name: 'plate_scan.jpg',
          type: 'image/jpeg',
        };
        formData.append('file', fileData as any);

        const response = await axios.post(API_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10000, // Evita cuelgues largos si la red no responde
        });

        setResult(response.data);
      } catch (error: any) {
        Alert.alert("Error de Conexión", "No se pudo conectar con el backend de lectura de placas.");
      } finally {
        setLoading(false);
      }
    }
  };

  const clearData = () => {
    setCapturedUri(null);
    setResult(null);
  };

  return (
    <View style={styles.darkBackground}>
      {/* Header Superior */}
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.statusText}>Listo para escanear</Text>
        </View>
        <Text style={styles.ipText}>192.168.1.50:8000</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Visor de Cámara con Retícula de Enfoque */}
        <View style={styles.cameraFrame}>
          <CameraView style={styles.camera} ref={cameraRef}>
            <View style={styles.overlayContainer}>
              <View style={styles.targetBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
          </CameraView>
        </View>

        {/* Muestra de Placa Detectada */}
        {result && (
          <View style={styles.plateDisplayCard}>
            <View style={styles.yellowPlateContainer}>
              <Text style={styles.yellowPlateText}>
                {result.placa_detectada !== "NO DETECTADA" ? result.placa_detectada : "--- ---"}
              </Text>
            </View>
            <Text style={styles.subText}>Ver foto analizada</Text>
          </View>
        )}

        {/* Card de Expediente del Vehículo (Simulado/Demo) */}
        {result && result.placa_detectada !== "NO DETECTADA" && (
          <View style={styles.expedienteCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.expedienteTitle}>Expediente del vehículo</Text>
              <View style={styles.demoBadge}><Text style={styles.demoText}>DEMO</Text></View>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>SOAT</Text>
                <Text style={styles.statusBoxValue}>Vencido · 28 de ago</Text>
              </View>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>RTM</Text>
                <Text style={styles.statusBoxValue}>Vencido · 13 de ago</Text>
              </View>
            </View>

            <Text style={styles.comparendosTitle}>1 comparendo(s) · deuda $ 19.500.000</Text>
            <View style={styles.multaBox}>
              <Text style={styles.multaCode}>D07 · Bucaramanga</Text>
              <Text style={styles.multaDesc}>No respetar los dispositivos de regulación de tránsito</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Controles de Disparo Inferiores */}
      <View style={styles.controlsFooter}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => clearData()}>
          <Text style={styles.secondaryText}>Limpiar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.shutterButtonOuter} 
          onPress={takePictureAndProcess}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <View style={styles.shutterButtonInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={takePictureAndProcess}>
          <Text style={styles.secondaryText}>Escanear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  darkBackground: { flex: 1, backgroundColor: '#121418', paddingTop: 40 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E222A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00E676', marginRight: 8 },
  statusText: { color: '#E0E0E0', fontSize: 12, fontWeight: '600' },
  ipText: { color: '#6C757D', fontSize: 12, alignSelf: 'center' },
  scrollContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  cameraFrame: { height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2E37', marginBottom: 16 },
  camera: { flex: 1 },
  overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  targetBox: { width: 220, height: 110, position: 'relative' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#FFD600' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  plateDisplayCard: { backgroundColor: '#1A1D24', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 },
  yellowPlateContainer: { backgroundColor: '#FFD600', paddingHorizontal: 28, paddingVertical: 10, borderRadius: 8 },
  yellowPlateText: { fontSize: 28, fontWeight: '900', letterSpacing: 3, color: '#000' },
  subText: { color: '#8F9BBA', fontSize: 12, marginTop: 8 },
  expedienteCard: { backgroundColor: '#1A1D24', borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  expedienteTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  demoBadge: { backgroundColor: '#A38400', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  demoText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusBox: { width: '48%', backgroundColor: '#222731', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#FF5252' },
  statusBoxLabel: { color: '#8F9BBA', fontSize: 10 },
  statusBoxValue: { color: '#FF5252', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  comparendosTitle: { color: '#FFF', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  multaBox: { backgroundColor: '#222731', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: '#FF5252' },
  multaCode: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  multaDesc: { color: '#8F9BBA', fontSize: 11, marginTop: 2 },
  controlsFooter: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 20 },
  shutterButtonOuter: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: '#FFD600', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  shutterButtonInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFD600' },
  secondaryButton: { backgroundColor: '#1E222A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 },
  secondaryText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  permissionText: { color: '#FFF', textAlign: 'center', marginBottom: 20 },
  accentButton: { backgroundColor: '#FFD600', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  btnText: { color: '#000', fontWeight: 'bold' }
});
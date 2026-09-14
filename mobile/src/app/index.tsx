import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

const API_URL = "http://192.168.1.46:8000/detect-plate";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.permissionText}>Se requieren permisos de cámara</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Otorgar Acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // PASO 1: Capturar foto y guardar en estado local
  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        setPhotoUri(photo.uri);
        setResult(null); // Limpiar predicciones anteriores
      } catch (error: any) {
        Alert.alert("Error", "No se pudo tomar la foto: " + error.message);
      }
    }
  };

  // PASO 2: Enviar la foto capturada al backend
  const sendToBackend = async () => {
    if (!photoUri) {
      Alert.alert("Atención", "Primero debes tomar una foto presionando el botón central.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      const fileData = {
        uri: photoUri.startsWith('file://') ? photoUri : `file://${photoUri}`,
        name: 'scan_image.jpg',
        type: 'image/jpeg',
      };
      formData.append('file', fileData as any);

      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000,
      });

      setResult(response.data);
    } catch (error: any) {
      console.error("Error al enviar:", error.message);
      Alert.alert("Error de Conexión", "No se obtuvo respuesta del servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setPhotoUri(null);
    setResult(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.statusLabel}>ALPR ENGINE ACTIVE</Text>
        <Text style={styles.nodeText}>192.168.1.46:8000</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Contenedor de Visor: Muestra la Cámara o la Foto Capturada */}
        <View style={styles.viewportContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          ) : (
            <CameraView style={styles.cameraAbsolute} ref={cameraRef} />
          )}

          <View style={styles.scanOverlay} pointerEvents="none">
            <View style={styles.reticle}>
              <View style={[styles.cornerBracket, styles.tl]} />
              <View style={[styles.cornerBracket, styles.tr]} />
              <View style={[styles.cornerBracket, styles.bl]} />
              <View style={[styles.cornerBracket, styles.br]} />
            </View>
          </View>
        </View>

        {/* Resultado devuelto por el Backend */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.sectionTitle}>PREDICCIÓN DEL BACKEND</Text>
            <View style={styles.plateBadge}>
              <Text style={styles.plateCode}>{result.placa_detectada}</Text>
            </View>
            <Text style={styles.messageText}>{result.mensaje}</Text>
          </View>
        )}
      </ScrollView>

      {/* Barra de Controles */}
      <View style={styles.footerBar}>
        <TouchableOpacity style={styles.btnSecondary} onPress={resetAll}>
          <Text style={styles.btnSecondaryText}>REINTENTAR</Text>
        </TouchableOpacity>

        {/* Botón Central: Solo Toma la Foto */}
        <TouchableOpacity style={styles.triggerOuter} onPress={takePhoto}>
          <View style={[styles.triggerInner, photoUri ? styles.triggerTaken : null]} />
        </TouchableOpacity>

        {/* Botón Escanear: Envía la Foto al Backend */}
        <TouchableOpacity 
          style={[styles.btnPrimaryCyan, !photoUri && styles.btnDisabled]} 
          onPress={sendToBackend}
          disabled={loading || !photoUri}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#00F2FE" />
          ) : (
            <Text style={styles.btnPrimaryText}>ESCANEAR</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19', paddingTop: 45 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  statusLabel: { color: '#00F2FE', fontSize: 11, fontWeight: '700' },
  nodeText: { color: '#4A5568', fontSize: 11, fontFamily: 'monospace' },
  content: { paddingHorizontal: 18, paddingBottom: 110 },
  viewportContainer: { height: 250, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#1E293B', marginBottom: 18, position: 'relative' },
  cameraAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  reticle: { width: 230, height: 100, position: 'relative' },
  cornerBracket: { position: 'absolute', width: 22, height: 22, borderColor: '#00F2FE' },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  resultCard: { backgroundColor: '#111827', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937', marginBottom: 16 },
  sectionTitle: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginBottom: 10 },
  plateBadge: { backgroundColor: '#00F2FE', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 6, marginBottom: 8 },
  plateCode: { fontSize: 26, fontWeight: '900', color: '#0B0F19', fontFamily: 'monospace' },
  messageText: { color: '#9CA3AF', fontSize: 12, textAlign: 'center' },
  footerBar: { position: 'absolute', bottom: 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 20 },
  triggerOuter: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: '#00F2FE', justifyContent: 'center', alignItems: 'center' },
  triggerInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#00F2FE' },
  triggerTaken: { backgroundColor: '#10B981' },
  btnSecondary: { backgroundColor: '#1F2937', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  btnSecondaryText: { color: '#9CA3AF', fontSize: 11, fontWeight: '700' },
  btnPrimaryCyan: { backgroundColor: '#161F30', borderWidth: 1, borderColor: '#00F2FE', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnPrimaryText: { color: '#00F2FE', fontSize: 11, fontWeight: '700' },
  permissionText: { color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },
  primaryBtn: { backgroundColor: '#00F2FE', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  primaryBtnText: { color: '#0B0F19', fontWeight: '800' }
});
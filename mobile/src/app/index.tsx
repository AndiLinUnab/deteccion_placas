import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// Dirección IP local del servidor FastAPI (Asegúrate de poner la IP de tu PC en la LAN)
const API_URL = "http://192.168.1.46:8000/detect-plate";

// Tipado TypeScript para la respuesta de la base de datos RUNT
interface RuntData {
  registrado: boolean;
  propietario?: string;
  vehiculo?: string;
  soat?: {
    estado: string;
    vencimiento: string;
  };
  tecnomecanica?: string;
  alerta_robo?: boolean;
  multas_pendientes?: number;
  mensaje?: string;
}

interface ApiResponse {
  status: string;
  placa_detectada: string;
  runt_data: RuntData | null;
}

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  // 1. Captura de foto usando la Cámara nativa
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso Denegado", "Se requiere acceso a la cámara para tomar fotografías.");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!res.canceled && res.assets[0].uri) {
      setImageUri(res.assets[0].uri);
      setResult(null); // Resetear estado anterior
    }
  };

  // 2. Selección de foto desde la Galería
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso Denegado", "Se requiere acceso a la galería para seleccionar imágenes.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!res.canceled && res.assets[0].uri) {
      setImageUri(res.assets[0].uri);
      setResult(null); // Resetear estado anterior
    }
  };

  // 3. Envío del archivo al Backend FastAPI (Soporta Re-escaneo)
  const scanPlate = async () => {
    if (!imageUri) return;

    setLoading(true);
    const formData = new FormData();

    // Inserción del blob de la imagen en Multipart Form Data
    formData.append('file', {
      uri: imageUri,
      name: 'plate_upload.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const response = await axios.post<ApiResponse>(API_URL, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000, // Timeout de 10 segundos
      });
      setResult(response.data);
    } catch (error) {
      Alert.alert(
        "Error de Comunicación", 
        "No se pudo conectar con el servidor de inferencia FastAPI. Revisa que el backend esté corriendo y en la misma red WiFi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>ALPR System - UNAB MLOps</Text>
      <Text style={styles.subtitle}>Detección de Placas & Consulta RUNT</Text>

      {/* Visor de Previsualización */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>📷 Selecciona o toma una foto para iniciar</Text>
        </View>
      )}

      {/* Botones de Selección de Origen */}
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.btnSecondary} onPress={takePhoto}>
          <Text style={styles.btnTextSecondary}>📷 Cámara</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={pickImage}>
          <Text style={styles.btnTextSecondary}>🖼️ Galería</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de Inferencia / Re-inferencia */}
      <TouchableOpacity 
        style={[styles.btnPrimary, !imageUri && styles.btnDisabled]} 
        onPress={scanPlate}
        disabled={!imageUri || loading}
      >
        <Text style={styles.btnTextPrimary}>
          {result ? "🔄 Volver a Escanear Placa" : "🔍 Escanear Placa"}
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#00F2FE" />
          <Text style={styles.loadingText}>Procesando modelo YOLOv8 + OCR...</Text>
        </View>
      )}

      {/* Tarjeta 1: Vehículo Registrado en el RUNT */}
      {result?.runt_data?.registrado && (
        <View style={[
          styles.runtCard, 
          result.runt_data.alerta_robo ? styles.bgDanger : styles.bgSuccess
        ]}>
          <Text style={styles.runtCardHeader}>HISTORIAL RUNT TRÁNSITO</Text>
          
          <View style={styles.plateBadge}>
            <Text style={styles.plateCode}>{result.placa_detectada}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Propietario:</Text>
            <Text style={styles.value}>{result.runt_data.propietario}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Vehículo:</Text>
            <Text style={styles.value}>{result.runt_data.vehiculo}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Estado SOAT:</Text>
            <Text style={styles.value}>
              {result.runt_data.soat?.estado} ({result.runt_data.soat?.vencimiento})
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Tecnomecánica:</Text>
            <Text style={styles.value}>{result.runt_data.tecnomecanica}</Text>
          </View>

          {result.runt_data.alerta_robo && (
            <View style={styles.alertBanner}>
              <Text style={styles.alertText}>⚠️ ¡ALERTA! VEHÍCULO CON REPORTE DE ROBO ACTIVO</Text>
            </View>
          )}
        </View>
      )}

      {/* Tarjeta 2: Placa Detectada pero NO Registrada */}
      {result && !result.runt_data?.registrado && (
        <View style={[styles.runtCard, styles.bgWarning]}>
          <Text style={styles.runtCardHeader}>PLACA DETECTADA: {result.placa_detectada}</Text>
          <Text style={styles.warningText}>
            La placa fue extraída correctamente por el OCR, pero no se encontró un expediente asociado en la base de datos RUNT.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    alignItems: 'center', 
    backgroundColor: '#121212', 
    minHeight: '100%' 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#00F2FE', 
    marginTop: 35 
  },
  subtitle: { 
    fontSize: 13, 
    color: '#8E8E93', 
    marginBottom: 20 
  },
  previewImage: { 
    width: '100%', 
    height: 220, 
    borderRadius: 12, 
    marginBottom: 15 
  },
  placeholderContainer: { 
    width: '100%', 
    height: 200, 
    borderRadius: 12, 
    marginBottom: 15, 
    backgroundColor: '#1C1C1E', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: '#38383A', 
    borderStyle: 'dashed'
  },
  placeholderText: { 
    color: '#8E8E93', 
    fontSize: 14 
  },
  rowButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%', 
    marginBottom: 10 
  },
  btnSecondary: { 
    backgroundColor: '#2C2C2E', 
    padding: 14, 
    borderRadius: 10, 
    flex: 0.48, 
    alignItems: 'center' 
  },
  btnTextSecondary: { 
    color: '#FFF', 
    fontWeight: '600', 
    fontSize: 15 
  },
  btnPrimary: { 
    backgroundColor: '#007AFF', 
    padding: 16, 
    borderRadius: 10, 
    width: '100%', 
    alignItems: 'center', 
    marginTop: 5 
  },
  btnDisabled: { 
    backgroundColor: '#3A3A3C' 
  },
  btnTextPrimary: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  loadingBox: { 
    marginTop: 20, 
    alignItems: 'center' 
  },
  loadingText: { 
    color: '#00F2FE', 
    marginTop: 8, 
    fontSize: 13 
  },
  runtCard: { 
    width: '100%', 
    padding: 20, 
    borderRadius: 14, 
    marginTop: 20 
  },
  bgSuccess: { 
    backgroundColor: '#143623', 
    borderColor: '#2D6A4F', 
    borderWidth: 1 
  },
  bgDanger: { 
    backgroundColor: '#4A1212', 
    borderColor: '#A4161A', 
    borderWidth: 1 
  },
  bgWarning: { 
    backgroundColor: '#3D3200', 
    borderColor: '#856404', 
    borderWidth: 1 
  },
  runtCardHeader: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#FFF', 
    marginBottom: 12, 
    textAlign: 'center',
    letterSpacing: 1
  },
  plateBadge: { 
    backgroundColor: '#FFD700', 
    paddingVertical: 6, 
    paddingHorizontal: 18, 
    borderRadius: 6, 
    alignSelf: 'center', 
    marginBottom: 15 
  },
  plateCode: { 
    color: '#000', 
    fontWeight: 'bold', 
    fontSize: 22, 
    letterSpacing: 3 
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 4
  },
  label: { 
    color: '#AAA', 
    fontSize: 13, 
    fontWeight: '500' 
  },
  value: { 
    color: '#FFF', 
    fontSize: 13, 
    fontWeight: 'bold' 
  },
  alertBanner: { 
    backgroundColor: '#FF3B30', 
    padding: 10, 
    borderRadius: 8, 
    marginTop: 12 
  },
  alertText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 13, 
    textAlign: 'center' 
  },
  warningText: { 
    color: '#E0E0E0', 
    fontSize: 13, 
    textAlign: 'center', 
    marginTop: 5 
  }
});
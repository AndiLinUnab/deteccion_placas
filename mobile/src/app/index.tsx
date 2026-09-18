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

// Dirección IP pública de la EC2 en AWS
const API_URL = "http://54.197.84.155:8000/detect-plate";

// Estructura adaptada al Backend Stateless (YOLOv8 + EasyOCR)
interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface PlateDetection {
  placa: string;
  confianza_yolo: number;
  confianza_ocr: number;
  bounding_box: BoundingBox;
}

interface ApiResponse {
  status: string;
  total_placas_encontradas: number;
  resultados: PlateDetection[];
}

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  // 1. Captura de foto usando la cámara nativa
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
      setResult(null); // Resetear estados anteriores
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
      setResult(null); // Resetear estados anteriores
    }
  };

  // 3. Envío multipart/form-data al backend FastAPI
  const scanPlate = async () => {
    if (!imageUri) return;

    setLoading(true);
    const formData = new FormData();

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
        timeout: 20000,
      });

      setResult(response.data);
    } catch (error) {
      Alert.alert(
        "Error de Comunicación", 
        "No se pudo conectar con el servidor de inferencia. Revisa que el servicio esté corriendo en la IP especificada."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>ALPR System - UNAB MLOps</Text>
      <Text style={styles.subtitle}>Escaneo Directo de Placas en Tiempo Real</Text>

      {/* Visor de Previsualización de Imagen */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>📷 Selecciona o toma una foto para iniciar</Text>
        </View>
      )}

      {/* Botones de Selección */}
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.btnSecondary} onPress={takePhoto}>
          <Text style={styles.btnTextSecondary}>📷 Cámara</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={pickImage}>
          <Text style={styles.btnTextSecondary}>🖼️ Galería</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de Inferencia */}
      <TouchableOpacity 
        style={[styles.btnPrimary, !imageUri && styles.btnDisabled]} 
        onPress={scanPlate}
        disabled={!imageUri || loading}
      >
        <Text style={styles.btnTextPrimary}>
          {result ? "🔄 Escanear Otra Imagen" : "🔍 Escanear Placa"}
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#00F2FE" />
          <Text style={styles.loadingText}>Procesando con YOLOv8 + EasyOCR...</Text>
        </View>
      )}

      {/* Resumen del Resutado */}
      {result && (
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryText}>
            Placas encontradas: {result.total_placas_encontradas}
          </Text>
        </View>
      )}

      {/* Listado dinámico de Detecciones */}
      {result?.resultados.map((item, index) => (
        <View key={index} style={{ width: '100%' }}>
          <View style={styles.runtCard}>
            <Text style={styles.runtCardHeader}>DETECCIÓN #{index + 1}</Text>
            
            <View style={styles.plateBadge}>
              <Text style={styles.plateCode}>{item.placa}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Precisión YOLOv8:</Text>
              <Text style={styles.value}>{(item.confianza_yolo * 100).toFixed(0)}%</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Precisión OCR:</Text>
              <Text style={styles.value}>{(item.confianza_ocr * 100).toFixed(0)}%</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Coordenadas Bounding Box:</Text>
              <Text style={styles.value}>
                [{item.bounding_box.x1}, {item.bounding_box.y1}, {item.bounding_box.x2}, {item.bounding_box.y2}]
              </Text>
            </View>
          </View>
        </View>
      ))}
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
  summaryBadge: {
    backgroundColor: '#1C1C1E',
    borderColor: '#00F2FE',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 15,
    width: '100%',
    alignItems: 'center'
  },
  summaryText: {
    color: '#00F2FE',
    fontWeight: 'bold',
    fontSize: 14
  },
  runtCard: { 
    width: '100%', 
    padding: 20, 
    borderRadius: 14, 
    marginTop: 15,
    backgroundColor: '#1C1C1E',
    borderColor: '#00F2FE',
    borderWidth: 1
  },
  runtCardHeader: { 
    fontSize: 14, 
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
  }
});
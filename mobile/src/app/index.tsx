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

// Dirección IP local de tu PC ejecutando FastAPI
const API_URL = "http://192.168.1.46:8000/detect-plate";

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  // 1. Capturar foto con la cámara del celular
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Se necesita acceso a la cámara");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5, // Comprime la imagen para reducir payload
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setResult(null); // Limpiar resultado previo
    }
  };

  // 2. Enviar imagen al Backend de FastAPI
  const scanPlate = async () => {
    if (!imageUri) {
      Alert.alert("Atención", "Toma una foto antes de escanear");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'plate.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (error) {
      Alert.alert("Error de red", "No se pudo conectar con el servidor en la PC");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sistema ALPR - MLOps</Text>

      {/* Vista previa de la foto */}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      )}

      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.btnCamera} onPress={takePhoto}>
          <Text style={styles.btnText}>📷 Tomar Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btnScan, !imageUri && styles.btnDisabled]} 
          onPress={scanPlate}
          disabled={!imageUri || loading}
        >
          <Text style={styles.btnText}>🔍 Escanear Placa</Text>
        </TouchableOpacity>
      </View>

      {/* Indicador de Carga */}
      {loading && <ActivityIndicator size="large" color="#00F2FE" style={{ marginVertical: 20 }} />}

      {/* TARJETA DE RESULTADOS DEL RUNT (AQUÍ VA EL CÓDIGO) */}
      {result?.runt_data?.registrado && (
        <View style={[
          styles.runtCard, 
          result.runt_data.alerta_robo ? styles.bgDanger : styles.bgSuccess
        ]}>
          <Text style={styles.runtTitle}>HISTORIAL RUNT TRÁNSITO</Text>
          
          <View style={styles.plateBadge}>
            <Text style={styles.plateCode}>{result.placa_detectada}</Text>
          </View>

          <Text style={styles.runtText}>👤 Propietario: {result.runt_data.propietario}</Text>
          <Text style={styles.runtText}>🚘 Vehículo: {result.runt_data.vehiculo}</Text>
          <Text style={styles.runtText}>📄 SOAT: {result.runt_data.soat.estado} ({result.runt_data.soat.vencimiento})</Text>
          <Text style={styles.runtText}>🔧 Tecnomecánica: {result.runt_data.tecnomecanica}</Text>
          
          {result.runt_data.alerta_robo && (
            <Text style={styles.alertText}>⚠️ ¡ALERTA! VEHÍCULO CON REPORTE DE ROBO</Text>
          )}
        </View>
      )}

      {/* Si la placa no está en el RUNT */}
      {result && !result.runt_data?.registrado && (
        <View style={[styles.runtCard, styles.bgWarning]}>
          <Text style={styles.runtTitle}>PLACA DETECTADA: {result.placa_detectada}</Text>
          <Text style={styles.runtText}>Vehículo no encontrado en la base de datos RUNT.</Text>
        </View>
      )}
    </ScrollView>
  );
}

// Estilos de la Interfaz Móvil
const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#121212',
    minHeight: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 40,
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  btnCamera: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  btnScan: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#555',
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  runtCard: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  bgSuccess: {
    backgroundColor: '#1b4332',
    borderColor: '#2d6a4f',
    borderWidth: 1,
  },
  bgDanger: {
    backgroundColor: '#600f0f',
    borderColor: '#a4161a',
    borderWidth: 1,
  },
  bgWarning: {
    backgroundColor: '#4a3b00',
    borderColor: '#856404',
    borderWidth: 1,
  },
  runtTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  plateBadge: {
    backgroundColor: '#FFD700',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 15,
  },
  plateCode: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 2,
  },
  runtText: {
    color: '#E0E0E0',
    fontSize: 14,
    marginBottom: 6,
  },
  alertText: {
    color: '#FF4D4D',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
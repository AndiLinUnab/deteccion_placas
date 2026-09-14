import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// ⚠️ REEMPLAZA ESTA IP por la IP local IPv4 de tu PC (ej: 192.168.1.50)
const API_URL = "http://192.168.1.50:8000/detect-plate";

export default function HomeScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Abrir la galería de imágenes del celular
  const pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!pickerResult.canceled) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  // Enviar imagen a FastAPI mediante FormData
  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert("Error", "Selecciona una imagen de la galería primero.");
      return;
    }

    setLoading(true);
    setResult(null);

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
      Alert.alert(
        "Error de conexión",
        "No se pudo conectar con el servidor FastAPI. Revisa que tu celular y PC estén en el mismo Wi-Fi y la IP sea la correcta."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Detector de Placas ALPR</Text>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      )}

      <View style={styles.buttonContainer}>
        <Button title="Seleccionar de Galería" onPress={pickImage} color="#007AFF" />
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title={loading ? "Procesando..." : "Procesar Placa"} 
          onPress={uploadImage} 
          disabled={!imageUri || loading} 
          color="#28A745" 
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}

      {result && (
        <View style={[styles.resultCard, result.placa_detectada !== "NO DETECTADA" ? styles.successCard : styles.errorCard]}>
          <Text style={styles.resultTitle}>Resultado del Análisis:</Text>
          <Text style={styles.resultText}>Placa: {result.placa_detectada}</Text>
          <Text style={styles.resultText}>Confianza: {result.confianza}</Text>
          <Text style={styles.statusText}>Estado: {result.estado}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F7' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1D1D1F' },
  previewImage: { width: 280, height: 180, borderRadius: 12, marginBottom: 20 },
  buttonContainer: { width: '100%', marginVertical: 8 },
  resultCard: { width: '100%', padding: 16, borderRadius: 12, marginTop: 20 },
  successCard: { backgroundColor: '#D4EDDA', borderColor: '#C3E6CB', borderWidth: 1 },
  errorCard: { backgroundColor: '#F8D7DA', borderColor: '#F5C6CB', borderWidth: 1 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  resultText: { fontSize: 16, color: '#155724', fontWeight: 'bold' },
  statusText: { fontSize: 14, color: '#6C757D', marginTop: 4 }
});

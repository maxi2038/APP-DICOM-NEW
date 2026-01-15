import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { api } from '../api/config';
import * as FileSystem from 'expo-file-system/legacy';

// URL BASE DE TUS ARCHIVOS EN AWS (Asegúrate de que sea la correcta, sin /api al final)
// Si tu backend guarda en 'public/uploads' o similar, ajusta esto.
const AWS_BASE_URL = 'http://dicombackend.us-east-2.elasticbeanstalk.com'; 

const EstudiosScreen = ({ route }) => {
  const { pacienteId, pacienteNombre } = route.params;
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchEstudios();
  }, []);

  const fetchEstudios = async () => {
    try {
      const response = await api.get(`/patients/${pacienteId}/studies`);
      setEstudios(response.data);
    } catch (err) {
      console.error("Error al cargar estudios:", err);
      Alert.alert('Error', 'No se pudieron cargar los estudios.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (estudio) => {
    // CORRECCIÓN: Usamos la URL de AWS, no la IP local 192.168...
    // Asumimos que la API devuelve la ruta relativa o el nombre del archivo
    // Ajusta si tu 'estudio.archivo_url' trae la ruta completa
    const downloadUrl = `${AWS_BASE_URL}/uploads/${estudio.nombreEstudio || estudio.nombre}`; 
    
    const fileName = estudio.nombreEstudio || estudio.nombre; 
    const fileUri = FileSystem.documentDirectory + fileName;

    try {
        Alert.alert('Descargando', `Iniciando descarga de ${fileName}...`);
        
        const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri);

        Alert.alert(
            'Descarga Completa', 
            `Archivo guardado con éxito.`, 
            [{ text: "OK" }]
        );
    } catch (e) {
        console.error('Error de descarga:', e);
        Alert.alert('Error', `Falló la descarga. Verifica que el archivo exista en el servidor.`);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
          <Text style={styles.title}>ID: {item.id || item.idEstudio}</Text>
          <Text style={styles.date}>{new Date(item.fechaEstudio || item.fecha).toLocaleDateString()}</Text>
      </View>

      <Text style={styles.label}>Archivo:</Text>
      <Text style={styles.detail}>{item.nombreEstudio || item.nombre}</Text>

      {/* --- AQUÍ AGREGAMOS LA DESCRIPCIÓN --- */}
      <Text style={styles.label}>Descripción:</Text>
      <Text style={styles.description}>
        {item.descripcion ? item.descripcion : "Sin descripción adjunta."}
      </Text>
      {/* ------------------------------------- */}

      <TouchableOpacity 
        style={styles.downloadButton} 
        onPress={() => handleDownload(item)}
      >
        <Text style={styles.buttonText}>Descargar ZIP</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Estudios de {pacienteNombre}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#00796b" style={styles.loading} />
      ) : (
        <FlatList
          data={estudios}
          renderItem={renderItem}
          keyExtractor={(item) => (item.id || item.idEstudio).toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Este paciente no tiene estudios.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { fontSize: 22, fontWeight: 'bold', padding: 15, color: '#00796b', textAlign: 'center' },
  loading: { flex: 1, justifyContent: 'center' },
  list: { paddingHorizontal: 15 },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 4, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5
  },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 14, color: '#888' },
  label: { fontSize: 12, color: '#999', marginTop: 5, fontWeight: '600' },
  detail: { fontSize: 15, color: '#333', marginBottom: 5 },
  
  // Estilo nuevo para la descripción
  description: { 
    fontSize: 14, 
    color: '#555', 
    fontStyle: 'italic', 
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 5,
    marginBottom: 15
  },
  
  downloadButton: {
    backgroundColor: '#00796b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#777' }
});

export default EstudiosScreen;


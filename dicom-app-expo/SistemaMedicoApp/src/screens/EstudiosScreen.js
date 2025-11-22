import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { api } from '../api/config';
import * as FileSystem from 'expo-file-system/legacy';

const EstudiosScreen = ({ route }) => {
  const { pacienteId, pacienteNombre } = route.params;
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEstudios();
  }, []);

  const fetchEstudios = async () => {
    try {
      // Usando el endpoint /api/patients/ID/studies
      const response = await api.get(`/patients/${pacienteId}/studies`); 
      setEstudios(response.data);
    } catch (err) {
      console.error("Error al cargar estudios:", err);
      setError('No se pudieron cargar los estudios. Revisa el ID y la API.');
    } finally {
      setLoading(false);
    }
  };


// ... dentro del componente EstudiosScreen ...

const handleDownload = async (estudio) => {
    // 🚨 1. CONSTRUIR LA URL REAL DE DESCARGA
    // Basado en tu estructura de rutas, ajusta el puerto y la IP aquí
    const downloadUrl = `http://192.168.100.97:3000/uploads/${route.params.pacienteId}/${estudio.nombre}`;
    
    // 2. Definir dónde se guardará el archivo en el dispositivo
    const fileName = estudio.nombre;
    const fileUri = FileSystem.documentDirectory + fileName;

    try {
        Alert.alert('Descargando', `Iniciando descarga de ${fileName}...`);
        
        const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri);

        Alert.alert(
            'Descarga Completa', 
            `Archivo guardado en: ${uri}`, 
            [
                // Opcional: Mostrar el archivo al usuario (solo funciona en iOS y Android específicos)
                { text: "Abrir", onPress: () => shareFile(uri) }, 
                { text: "OK" }
            ]
        );
    } catch (e) {
        console.error('Error de descarga:', e);
        Alert.alert('Error', `Fallo la descarga. Revisa la URL: ${downloadUrl}`);
    }
};

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>ID: {item.id}</Text>
      <Text style={styles.detail}>Nombre: {item.nombre}</Text>
      <Text style={styles.detail}>Fecha: {new Date(item.fechaEstudio).toLocaleDateString()}</Text>

      <View style={styles.buttonContainer}>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Estudios de {pacienteNombre}</Text>
      <FlatList
        data={estudios}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Este paciente no tiene estudios registrados.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { fontSize: 22, fontWeight: 'bold', padding: 15, color: '#333' },
  loading: { flex: 1, justifyContent: 'center' },
  errorText: { textAlign: 'center', marginTop: 50, color: 'red' },
  list: { paddingHorizontal: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  detail: { fontSize: 14, color: '#555' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#777',
  }
});

export default EstudiosScreen;
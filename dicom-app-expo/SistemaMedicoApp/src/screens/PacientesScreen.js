import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { api } from '../api/config';

const PacientesScreen = ({ navigation, onLogout }) => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      const response = await api.get('/patients');
      setPacientes(response.data);
    } catch (err) {
      console.error("Error al cargar pacientes:", err);
      setError('No se pudieron cargar los pacientes. Revisa tu API.');
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      // 1. Aseguramos que el fondo de la barra sea blanco y el título negro
      headerStyle: { backgroundColor: '#ffffff' },
      headerTintColor: '#000000',
      headerTitleStyle: { fontWeight: 'bold' },

      // 2. Botón Derecho: CHATBOT (Fondo Verde Teal, Texto Blanco)
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Chatbot')}
          style={styles.headerButtonRight}
        >
          <Text style={styles.headerButtonText}>Chatbot</Text>
        </TouchableOpacity>
      ),

      // 3. Botón Izquierdo: CERRAR SESIÓN (Fondo Rojo, Texto Blanco)
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Cerrar Sesión",
              "¿Estás seguro de que quieres salir?",
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Sí", onPress: onLogout }
              ]
            );
          }}
          style={styles.headerButtonLeft}
        >
          <Text style={styles.headerButtonText}>Salir</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, onLogout]);


  if (loading) {
    return <ActivityIndicator size="large" color="#00796b" style={styles.loading} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Estudios', { pacienteId: item.id, pacienteNombre: item.nombre })}
    >
      <Text style={styles.name}>{item.nombre}</Text>
      <Text style={styles.detail}>Sexo: {item.sexo === 1 ? 'Hombre' : 'Mujer'}</Text>
      <Text style={styles.detail}>Ingreso: {new Date(item.fechaIngreso).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lista de Pacientes</Text>
      <FlatList
        data={pacientes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 15, color: '#00796b' },
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
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  detail: { fontSize: 14, color: '#555' },
  
  // ESTILOS NUEVOS PARA LOS BOTONES DE ARRIBA
  headerButtonRight: {
    backgroundColor: '#00796b', // Verde
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 5,
  },
  headerButtonLeft: {
    backgroundColor: '#d32f2f', // Rojo
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 5,
  },
  headerButtonText: {
    color: '#ffffff', // Texto blanco
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default PacientesScreen;
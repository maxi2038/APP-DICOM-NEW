import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api/config';

const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, ingresa usuario y contraseña.');
      return;
    }
    
    setLoading(true);

    try {
      const response = await api.post('/login', { username, password }); 
      
      if (response.data.success) {
        onLoginSuccess(response.data.user); 
      } else {
        Alert.alert('Error de Login', response.data.message || 'Credenciales inválidas.');
      }
    } catch (error) {
      console.error('Error de red o API:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Error al conectar con el servidor.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sistema Médico</Text>
      
      <View style={styles.loginBox}>
        <Text style={styles.header}>Inicia Sesión</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          placeholderTextColor="#666" // <-- AQUI ESTA EL CAMBIO (Gris oscuro)
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#666" // <-- AQUI TAMBIEN
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <View style={styles.buttonContainer}>
            <Button 
            title={loading ? "Cargando..." : "Iniciar sesión"} 
            onPress={handleLogin} 
            color="#00796b" 
            disabled={loading}
            />
        </View>
        
        {loading && <ActivityIndicator size="small" color="#00796b" style={{ marginTop: 10 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f0f4f7' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 30, 
    color: '#00796b' 
  },
  loginBox: { 
    width: '85%', 
    maxWidth: 400, 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 15, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 5, 
  },
  header: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center', 
    color: '#333' 
  },
  input: { 
    height: 50, 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    marginBottom: 15, 
    backgroundColor: '#fafafa', // Un fondo un poquito gris para diferenciarlo
    fontSize: 16, 
    color: '#000' // Texto negro al escribir
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden' // Para que el borde redondeado afecte al botón en Android
  }
});

export default LoginScreen;
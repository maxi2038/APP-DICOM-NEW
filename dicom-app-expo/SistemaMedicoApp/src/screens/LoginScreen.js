import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { api } from '../api/config'; // Importa la configuración de Axios

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
      // 🚨 Petición al endpoint de Node.js: /api/login
      const response = await api.post('/login', { username, password }); 
      
      if (response.data.success) {
        // Llama a la función del padre para indicar que la autenticación fue exitosa
        onLoginSuccess(response.data.user); 
      } else {
        // Esto captura mensajes como 'Usuario o contraseña incorrectos.' desde tu Node.js
        Alert.alert('Error de Login', response.data.message || 'Credenciales inválidas.');
      }
    } catch (error) {
      console.error('Error de red o API:', error.response?.data || error.message);
      
      // Manejo específico del error 401 (No autorizado) que tu API envía
      const message = error.response?.data?.message || 'Error al conectar con el servidor. Revisa tu IP y puerto 3000.';
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
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <Button 
          title={loading ? "Cargando..." : "Iniciar sesión"} 
          onPress={handleLogin} 
          color="#00796b" 
          disabled={loading}
        />
        
        {loading && <ActivityIndicator size="small" color="#00796b" style={{ marginTop: 10 }} />}
      </View>
    </View>
  );
};

// ... estilos (styles) ...
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f7' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 50, color: '#00796b' },
  loginBox: { width: '85%', maxWidth: 400, backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#fff', fontSize: 16, },
});

export default LoginScreen;
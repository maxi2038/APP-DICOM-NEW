import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null); // Contendrá los datos del usuario si está logueado

 useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00796b" />
      </View>
    );
  }
  
  // Función que se pasa al LoginScreen para actualizar el estado global al autenticarse
 const handleLoginSuccess = (userData) => {
    setUserToken(userData);
  };
  const handleLogout = () => {
    // Aquí también limpiarías cualquier token guardado en el dispositivo (AsyncStorage, etc.)
    setUserToken(null);
  };
  
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {/* Si userToken NO es nulo, mostramos la aplicación principal. */}
      {/* Si userToken es nulo, mostramos la pantalla de Login y le pasamos la función para loguearse. */}
      {userToken ? (
        <MainNavigator onLogout={handleLogout} /> 
     ) : (
        <AuthNavigator onLoginSuccess={handleLoginSuccess} />
      )}
    </NavigationContainer>
  );
}
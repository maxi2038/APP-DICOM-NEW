import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PacientesScreen from '../screens/PacientesScreen';
import EstudiosScreen from '../screens/EstudiosScreen';
import ChatbotScreen from '../screens/ChatbotScreen'; 

const Stack = createNativeStackNavigator();

// --- MODIFICADO: El componente ahora recibe la prop 'onLogout' ---
const MainNavigator = ({ onLogout }) => {
  return (
    <Stack.Navigator 
      initialRouteName="Pacientes"
      screenOptions={{
        headerStyle: { backgroundColor: '#00796b' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <Stack.Screen 
        name="Chatbot" 
        component={ChatbotScreen} 
        options={{ title: 'Asistente IA Médico' }}
      />
      {/* --- MODIFICADO: Se usa la sintaxis de "render prop" para pasar 'onLogout' --- */}
      <Stack.Screen name="Pacientes" options={{ title: 'Pacientes Registrados' }}>
        {props => <PacientesScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen 
        name="Estudios" 
        component={EstudiosScreen} 
        options={({ route }) => ({ title: `Estudios de ${route.params.pacienteNombre}` })}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
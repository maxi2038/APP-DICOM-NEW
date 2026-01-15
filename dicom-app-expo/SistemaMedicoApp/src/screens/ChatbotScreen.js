import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  FlatList, 
  Keyboard, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, // <-- Nuevo componente importado
  Platform,             // <-- Para detectar si es Android o iOS
  SafeAreaView          // <-- Para respetar los bordes seguros (notch)
} from 'react-native';
import { api } from '../api/config'; 

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef();

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now(), text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    
    const originalInput = input;
    setInput('');
    setLoading(true);
    // En este caso, a veces es mejor NO ocultar el teclado para seguir chateando,
    // pero si prefieres que baje, deja esta línea:
    // Keyboard.dismiss(); 

    try {
      const response = await api.post('/chat', { 
          message: originalInput 
      });

      const data = response.data;
      const botReply = data.reply || 'No pude obtener una respuesta válida del asistente.';

      const botMessage = { 
          id: Date.now() + 1, 
          text: botReply, 
          isUser: false 
      };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error al llamar al chatbot:', error);
      Alert.alert('Error', 'No se pudo conectar con el asistente médico. Intente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={item.isUser ? styles.userMessage : styles.botMessage}>
      <Text style={item.isUser ? styles.userText : styles.botText}>
        {/* Agregué negritas para distinguir mejor quién habla */}
        <Text style={{fontWeight: 'bold'}}>{item.isUser ? 'Tú: ' : 'Bot: '}</Text> 
        {item.text}
      </Text>
    </View>
  );

  return (
    // SafeAreaView asegura que no choque con la barra de estado superior
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        // Configuración clave para que suba con el teclado
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu consulta..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            editable={!loading}
            placeholderTextColor="#666"
          />
          <Button 
            title={loading ? "..." : "Enviar"} 
            onPress={handleSend} 
            disabled={loading} 
            color="#00796b" 
          />
          {loading && <ActivityIndicator style={styles.spinner} size="small" color="#00796b" />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f7' },
  container: { flex: 1 }, // El contenedor principal toma todo el espacio
  
  listContent: { 
    paddingHorizontal: 10, 
    paddingVertical: 15,
    paddingBottom: 20 // Un poco de espacio extra al final del chat
  },
  
  userMessage: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#DCF8C6', // Verde tipo WhatsApp más suave
    marginVertical: 5, 
    padding: 12, 
    borderRadius: 15, 
    maxWidth: '80%',
    borderBottomRightRadius: 2
  },
  
  botMessage: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#fff', 
    marginVertical: 5, 
    padding: 12, 
    borderRadius: 15, 
    maxWidth: '80%', 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    borderBottomLeftRadius: 2
  },
  
  userText: { color: '#000', fontSize: 16 },
  botText: { color: '#333', fontSize: 16 },
  
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: '#ccc',
    // ESTOS SON LOS CAMBIOS PARA EL ESPACIO ABAJO:
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 25, // <-- Esto levanta la barra para que no pegue con los botones de Android
  },
  
  input: { 
    flex: 1, 
    height: 45, // Un poco más alto para que sea fácil de tocar
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 25, 
    paddingHorizontal: 20, 
    marginRight: 10,
    backgroundColor: '#fafafa',
    color: '#000'
  },
  
  spinner: { 
    position: 'absolute', 
    right: 80, // Ajustado para que no se encime
    top: 22 
  },
});

export default ChatbotScreen;
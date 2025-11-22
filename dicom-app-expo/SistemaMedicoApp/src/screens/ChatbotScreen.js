import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Keyboard, ActivityIndicator, Alert } from 'react-native';

//Ruta Local
const CHATBOT_API_URL = "http://192.168.100.97/Dicomsystem/admin/bot_api.php"; 

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
    Keyboard.dismiss();

    try {
      // Petición POST al script PHP
      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: originalInput })
      });

      if (!response.ok) {
          // Captura errores HTTP
          throw new Error(`Error de servidor: ${response.status} ${response.statusText}.`);
      }

      const data = await response.json();
      
      // Maneja la respuesta JSON del script bot_api.php
      const botReply = data.reply || 'No pude obtener una respuesta válida del asistente.';

      const botMessage = { 
          id: Date.now() + 1, 
          text: botReply, 
          isUser: false 
      };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error al llamar al chatbot:', error);
      Alert.alert('Error de Chatbot', `Fallo la comunicación: ${error.message}. Verifica tu URL y servidor Apache.`);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={item.isUser ? styles.userMessage : styles.botMessage}>
      <Text style={item.isUser ? styles.userText : styles.botText}>
        {item.isUser ? 'Tú: ' : 'Bot: '} {item.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu consulta sobre pacientes o estudios..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          editable={!loading}
        />
        <Button title={loading ? "..." : "Enviar"} onPress={handleSend} disabled={loading} color="#00796b" />
        {loading && <ActivityIndicator style={styles.spinner} size="small" color="#00796b" />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f7' },
  listContent: { paddingVertical: 10 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#e1ffc7', margin: 5, padding: 10, borderRadius: 10, maxWidth: '80%' },
  botMessage: { alignSelf: 'flex-start', backgroundColor: '#fff', margin: 5, padding: 10, borderRadius: 10, maxWidth: '80%', borderWidth: 1, borderColor: '#ccc' },
  userText: { color: '#000' },
  botText: { color: '#333' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center', borderTopWidth: 1, borderColor: '#ccc' },
  input: { flex: 1, height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, marginRight: 10 },
  spinner: { position: 'absolute', right: 25 },
});

export default ChatbotScreen;
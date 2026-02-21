import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/api';

const ChatScreen = () => {
  const { guest, reservation, hotelId } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      text: `Olá ${guest?.name?.split(' ')[0]}! Sou o Jarbas, seu assistente virtual. Como posso ajudar você hoje?`,
      time: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  const quickReplies = [
    'Horário do café da manhã?',
    'Senha do Wi-Fi',
    'Reservar restaurante',
    'Informações do spa'
  ];

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim(),
      time: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await chatService.sendMessage(text, reservation?.guest_id, hotelId);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: response.message || response.response || 'Desculpe, não consegui processar sua mensagem.',
        time: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: 'Desculpe, ocorreu um erro. Por favor, tente novamente ou ligue para a recepção (ramal 0).',
        time: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Ionicons name="chatbubbles" size={24} color="#D4AF37" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Jarbas</Text>
            <Text style={styles.headerSubtitle}>Assistente Virtual</Text>
          </View>
        </View>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.type === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper
            ]}
          >
            {message.type === 'bot' && (
              <View style={styles.botAvatar}>
                <Ionicons name="sparkles" size={16} color="#D4AF37" />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                message.type === 'user' ? styles.userBubble : styles.botBubble
              ]}
            >
              <Text style={[
                styles.messageText,
                message.type === 'user' ? styles.userText : styles.botText
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.messageTime,
                message.type === 'user' ? styles.userTime : styles.botTime
              ]}>
                {formatTime(message.time)}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingContainer}>
            <View style={styles.botAvatar}>
              <Ionicons name="sparkles" size={16} color="#D4AF37" />
            </View>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.typingText}>Digitando...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Replies */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.quickRepliesContainer}
        contentContainerStyle={styles.quickRepliesContent}
      >
        {quickReplies.map((reply, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickReply}
            onPress={() => sendMessage(reply)}
          >
            <Text style={styles.quickReplyText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#475569"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || loading}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() ? '#0B1120' : '#475569'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#151E32',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 12,
    color: '#10B981',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#D4AF37',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#0B1120',
  },
  botText: {
    color: '#F8FAFC',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(11, 17, 32, 0.6)',
    textAlign: 'right',
  },
  botTime: {
    color: '#475569',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  quickRepliesContainer: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  quickRepliesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  quickReply: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  quickReplyText: {
    fontSize: 13,
    color: '#D4AF37',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: '#151E32',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F8FAFC',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default ChatScreen;

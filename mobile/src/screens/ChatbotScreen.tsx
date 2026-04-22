import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Alert } from 'react-native';
import { sendChatMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export default function ChatbotScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: `Hello ${user?.full_name || ''}! 👋 I am your AI Medical Assistant 🤖. I can help interpret scan results or answer medical questions. How can I assist you today? 🩺`, sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputText.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await sendChatMessage(userMsg.text);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: response.reply, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: 'Sorry, I am having trouble connecting right now. 😔', sender: 'bot' }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleEditMessage = (item: Message) => {
    setInputText(item.text);
    setMessages(prev => prev.filter(msg => msg.id !== item.id));
  };

  const handleDeleteMessage = (item: Message) => {
    setMessages(prev => prev.filter(msg => msg.id !== item.id));
  };

  const onMessageLongPress = (item: Message) => {
    const isDoctorOrAdmin = user?.role === 'doctor' || user?.role === 'admin';
    const canModify = item.sender === 'user' || isDoctorOrAdmin;

    if (!canModify) return;

    Alert.alert(
      "Message Options ⚙️",
      "What would you like to do with this message?",
      [
        { text: "Cancel ❌", style: "cancel" },
        { text: "Edit ✏️", onPress: () => handleEditMessage(item) },
        { text: "Delete 🗑️", onPress: () => handleDeleteMessage(item), style: "destructive" }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <TouchableOpacity 
        onLongPress={() => onMessageLongPress(item)}
        activeOpacity={0.8}
        style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}
      >
        <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
          {item.text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingPulse}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
          <Text style={styles.loadingText}>AI Assistant is typing... 💭</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a medical question... 🏥💊"
          placeholderTextColor={theme.onSurfaceVariant}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]} onPress={sendMessage} disabled={!inputText.trim() || loading} activeOpacity={0.8}>
          <Text style={styles.sendIcon}>🚀</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  chatContainer: { padding: 24, paddingBottom: 32, gap: 16 },
  messageBubble: { maxWidth: '85%', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: theme.outlineVariant },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.primary, borderBottomRightRadius: 4, borderColor: theme.primary },
  botBubble: { alignSelf: 'flex-start', backgroundColor: theme.surfaceContainer, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  userText: { color: theme.onPrimary, fontWeight: '800' },
  botText: { color: theme.onSurface },
  
  loadingContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 20, gap: 12 },
  loadingPulse: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.onSurfaceVariant, fontSize: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  
  inputContainer: { 
    flexDirection: 'row', 
    padding: 20, 
    paddingBottom: Platform.OS === 'ios' ? 36 : 20, 
    backgroundColor: theme.surfaceContainerLowest,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.outlineVariant
  },
  input: { 
    flex: 1, 
    backgroundColor: theme.surfaceContainerHigh, 
    borderRadius: 20, 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 16, 
    minHeight: 56, 
    maxHeight: 120, 
    fontSize: 16, 
    color: theme.onSurface,
    fontWeight: '600'
  },
  sendButton: { 
    width: 56, 
    height: 56, 
    borderRadius: 16, 
    backgroundColor: theme.primary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 16 
  },
  sendIcon: { color: theme.onPrimary, fontSize: 24, fontWeight: '800' },
});

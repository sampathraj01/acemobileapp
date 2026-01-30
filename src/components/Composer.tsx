import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useChatStore } from '../store/useChatStore';

export function Composer() {
  const [text, setText] = useState('');
  const { sendMessage, currentGroupId } = useChatStore();

  const handleSend = async () => {
    if (!text.trim() || !currentGroupId) return;

    await sendMessage(text);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Type a message..."
        value={text}
        onChangeText={setText}
        style={styles.input}
      />

      <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
        <Text style={styles.sendText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff'
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 10
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20
  },
  sendText: {
    color: '#fff',
    fontWeight: '600'
  }
});

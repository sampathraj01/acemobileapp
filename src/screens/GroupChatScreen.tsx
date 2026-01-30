import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GroupChatHeader } from '../components/GroupChatHeader';
import { MessageList } from '../components/MessageList';
import { Composer } from '../components/Composer';

export default function GroupChatScreen() {
  return (
    <View style={styles.container}>
        <GroupChatHeader />
        <MessageList />
        <Composer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});

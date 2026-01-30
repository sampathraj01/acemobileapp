import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ProjectHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>ACE Group Chat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  title: {
    color: '#110707',
    fontSize: 20,
    fontWeight: '700',
  },
});

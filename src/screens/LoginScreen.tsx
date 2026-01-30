import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../models/navigation';
import Icon from 'react-native-vector-icons/Ionicons';



type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [userId, setUserId] = useState('globaladmin');
  const [password, setPassword] = useState('GlobalPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, checkAuth, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      navigation.replace('Tabs');
    }
  }, [user]);

  const handleSubmit = async () => {
    setError('');

    if (!userId.trim() || !password.trim()) {
      setError('Please enter both userId and password');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(userId.trim(), password);
      if (!success) {
        setError('Invalid userId or password');
      }
    } catch (error) {
      console.log('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Group Chat</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          placeholder="Enter your user ID"
          value={userId}
          onChangeText={setUserId}
          style={styles.input}
          editable={!isLoading}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            editable={!isLoading}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={22} color="#555" />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.testBox}>
          <Text style={styles.testTitle}>Test Credentials:</Text>
          <Text style={styles.testText}>Global Admin: globaladmin / GlobalPass123!</Text>
          <Text style={styles.testText}>Regular User: regularuser / RegularPass123!</Text>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 24,
    elevation: 6
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  disabled: {
    backgroundColor: '#9ca3af'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  },
  testBox: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#e5e7eb'
  },
  testTitle: {
    fontWeight: '600',
    fontSize: 12
  },
  testText: {
    fontSize: 11,
    color: '#6b7280'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 12,
  },

  eyeButton: {
    paddingLeft: 10,
  },

});

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/LoginScreen';
import ChatScreen from '../screens/ChatScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import GroupsCreateScreen from '../screens/GroupsCreate';
import UsersCreateScreen from '../screens/UsersCreate';
import LogoutScreen from '../screens/LogoutScreen';

import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList, TabParamList , ChatStackParamList } from '../models/navigation';
import { apolloClient } from '../services/aws/apollo-client';
import { GET_MY_PROFILE } from '../services/aws/graphql';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator  screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Chat" component={ChatStackNavigator} />
      <Tab.Screen name="GroupsCreate" component={GroupsCreateScreen} />
      <Tab.Screen name="UsersCreate" component={UsersCreateScreen} />
      <Tab.Screen name="Logout" component={LogoutScreen} />
    </Tab.Navigator>
  );
}

function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="Groups" component={ChatScreen} />
      <ChatStack.Screen name="GroupChat" component={GroupChatScreen} options={{ headerShown: false }} />
    </ChatStack.Navigator>
  );
}


export default function AppNavigator() {
  const { user, checkAuth, isLoading ,  setProfile } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    apolloClient
      .query({ query: GET_MY_PROFILE, fetchPolicy: 'network-only' })
      .then((res) => {
        const p = res.data?.getMyProfile;
        if (p && typeof p.isGlobalAdmin === 'boolean') setProfile({ isGlobalAdmin: p.isGlobalAdmin });
      })
      .catch(() => {});
  }, [user?.userId, setProfile]);

  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Tabs" component={Tabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

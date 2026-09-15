import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, iconSize, touchTarget } from '@/design/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.black,
          borderTopColor: colors.border,
          minHeight: touchTarget + 8,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={iconSize.lg} color={color} />,
        }}
      />
      <Tabs.Screen
        name="maclar"
        options={{
          title: 'MAÇLAR',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={iconSize.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tribun"
        options={{
          title: 'TRİBÜN',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={iconSize.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="oyna"
        options={{
          title: 'OYNA',
          tabBarIcon: ({ color }) => (
            <Ionicons name="game-controller-outline" size={iconSize.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'PROFİL',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={iconSize.lg} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

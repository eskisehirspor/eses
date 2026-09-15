import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, StyleSheet } from 'react-native';
import { colors, iconSize, layout, typography } from '@/design/tokens';
import { navIcons } from '@/design/icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.black,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderSubtle,
          height: layout.tabBarHeight + (Platform.OS === 'ios' ? 20 : 10),
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        },
        tabBarItemStyle: {
          minHeight: 44,
        },
        tabBarLabelStyle: {
          fontFamily: typography.family.uiSemi,
          fontSize: 9,
          letterSpacing: 1.2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? navIcons.home.active : navIcons.home.idle} size={iconSize.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="maclar"
        options={{
          title: 'MAÇLAR',
          tabBarAccessibilityLabel: 'Maçlar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? navIcons.matches.active : navIcons.matches.idle}
              size={iconSize.lg}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tribun"
        options={{
          title: 'TRİBÜN',
          tabBarAccessibilityLabel: 'Tribün',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? navIcons.tribune.active : navIcons.tribune.idle}
              size={iconSize.lg}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="oyna"
        options={{
          title: 'OYNA',
          tabBarAccessibilityLabel: 'Oyna',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? navIcons.play.active : navIcons.play.idle} size={iconSize.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'PROFİL',
          tabBarAccessibilityLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? navIcons.profile.active : navIcons.profile.idle}
              size={iconSize.lg}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

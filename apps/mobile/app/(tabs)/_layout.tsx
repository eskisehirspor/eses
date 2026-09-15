import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, StyleSheet } from 'react-native';
import { iconSize, layout, typography } from '@/design/tokens';
import { useColors } from '@/design/theme-context';
import { navIcons } from '@/design/icons';

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderSubtle,
          height: layout.tabBarHeight + (Platform.OS === 'ios' ? 20 : 10),
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        },
        tabBarItemStyle: {
          minHeight: 44,
        },
        tabBarLabelStyle: {
          fontFamily: typography.family.ui,
          fontSize: typography.size.tab,
          lineHeight: typography.lineHeight.tab,
          fontWeight: typography.weight.semibold,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? navIcons.home.active : navIcons.home.idle} size={iconSize.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="maclar"
        options={{
          title: 'Maçlar',
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
          title: 'Tribün',
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
          title: 'Oyna',
          tabBarAccessibilityLabel: 'Oyna',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? navIcons.play.active : navIcons.play.idle} size={iconSize.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
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

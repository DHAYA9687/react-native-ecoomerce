// src/screens/ProfileScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../store/authStore';

// ---- Temporary mock data (replace with auth/user store later) ----
const USER = {
  name: 'Dhaya',
  email: 'sekarsekar@email.com',
  avatar: 'https://picsum.photos/seed/user1/200/200',
  ordersCount: 12,
  wishlistCount: 8,
  reviewsCount: 4,
};
// -------------------------------------------------------------

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type MenuItem = {
  id: string;
  label: string;
  icon: IoniconName;
  route?: string;
  danger?: boolean;
};

const ACCOUNT_ITEMS: MenuItem[] = [
  { id: 'orders', label: 'My Orders', icon: 'receipt-outline', route: 'Orders' },
  { id: 'wishlist', label: 'Wishlist', icon: 'heart-outline' },
  { id: 'addresses', label: 'Shipping Addresses', icon: 'location-outline' },
  { id: 'payment', label: 'Payment Methods', icon: 'card-outline' },
];

const PREFERENCES_ITEMS: MenuItem[] = [
  { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  { id: 'language', label: 'Language', icon: 'language-outline' },
  { id: 'privacy', label: 'Privacy & Security', icon: 'lock-closed-outline' },
];

const SUPPORT_ITEMS: MenuItem[] = [
  { id: 'help', label: 'Help Center', icon: 'help-circle-outline' },
  { id: 'about', label: 'About App', icon: 'information-circle-outline' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  // const { signOut } = useAuth();
  const signout = useAuthStore((state)=> state.signOut)

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        // Flipping auth state swaps AppNavigator back to the auth layer.
        // onPress: () => signOut(),
        onPress:()=> signout(),
      },
    ]);
  };

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      activeOpacity={0.7}
      onPress={() => item.route && navigation.navigate(item.route)}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIconWrapper}>
          <Ionicons name={item.icon} size={18} color="#4B5563" />
        </View>
        <Text style={styles.menuLabel}>{item.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: MenuItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>
        {items.map((item, index) => renderMenuItem(item, index === items.length - 1))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* User card */}
        <View style={styles.userCard}>
          <Image source={{ uri: USER.avatar }} style={styles.avatar} contentFit="cover" />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{USER.name}</Text>
            <Text style={styles.userEmail}>{USER.email}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={16} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{USER.ordersCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{USER.wishlistCount}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{USER.reviewsCount}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* Menu sections */}
        {renderSection('Account', ACCOUNT_ITEMS)}
        {renderSection('Preferences', PREFERENCES_ITEMS)}
        {renderSection('Support', SUPPORT_ITEMS)}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  userEmail: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F3F4F6',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 16,
  },
});
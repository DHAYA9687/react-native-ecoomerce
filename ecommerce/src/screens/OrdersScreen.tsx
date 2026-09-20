// src/screens/OrdersScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { Order, useOrderStore } from '../store/orderStore';
import { formatPrice } from '../utils/currency';

type StatusFilter = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const STATUS_CONFIG: Record<
  StatusFilter,
  { label: string; color: string; bg: string; icon: IoniconName }
> = {
  all: { label: 'All', color: '#6B7280', bg: '#F3F4F6', icon: 'ellipsis-horizontal-outline' },
  processing: { label: 'Processing', color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  shipped: { label: 'Shipped', color: '#2563EB', bg: '#DBEAFE', icon: 'cube-outline' },
  delivered: { label: 'Delivered', color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
};

// The backend only tracks PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED - fold
// the pre-shipping states into a single "processing" bucket for the UI filters.
function toDisplayStatus(status: Order['status']): StatusFilter {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED':
      return 'processing';
    case 'SHIPPED':
      return 'shipped';
    case 'DELIVERED':
      return 'delivered';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'processing';
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.user?.id);
  const orders = useOrderStore((state) => state.orders);
  const isLoading = useOrderStore((state) => state.isLoading);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        fetchOrders(userId).catch((err) => console.error('Fetch orders error:', err));
      }
    }, [userId, fetchOrders])
  );

  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    try {
      await fetchOrders(userId);
    } catch (err) {
      console.error('Refresh orders error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, fetchOrders]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return sortedOrders;
    return sortedOrders.filter((o) => toDisplayStatus(o.status) === activeFilter);
  }, [sortedOrders, activeFilter]);

  const renderFilter = ({ item }: { item: (typeof FILTERS)[number] }) => (
    <TouchableOpacity
      style={[styles.filterPill, activeFilter === item.id && styles.filterPillActive]}
      onPress={() => setActiveFilter(item.id)}
    >
      <Text
        style={[
          styles.filterText,
          activeFilter === item.id && styles.filterTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrder = ({ item }: { item: Order }) => {
    const displayStatus = toDisplayStatus(item.status);
    const config = STATUS_CONFIG[displayStatus];
    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('OrderDetails', { id: item.orderId })}
      >
        <View style={[styles.orderThumbnail, { backgroundColor: config.bg }]}>
          <Ionicons name="receipt-outline" size={22} color={config.color} />
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.orderTopRow}>
            <Text style={styles.orderId}>Order #{item.orderId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon} size={12} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>

          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>

          <View style={styles.orderBottomRow}>
            <Text style={styles.orderMeta}>
              {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.orderTotal}>{formatPrice(item.totalAmount)}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <FlatList
        data={FILTERS}
        keyExtractor={(item) => item.id}
        renderItem={renderFilter}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterListWrapper}
        contentContainerStyle={styles.filterList}
      />

      {isLoading && orders.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color="#111827" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.orderId)}
          renderItem={renderOrder}
          contentContainerStyle={[
            styles.listContent,
            filteredOrders.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#111827"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No orders here</Text>
              <Text style={styles.emptySubtitle}>
                Orders with this status will show up here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  filterListWrapper: {
    flexGrow: 0,
    height: 40,
    marginBottom: 16,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  filterPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  orderThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  orderMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});

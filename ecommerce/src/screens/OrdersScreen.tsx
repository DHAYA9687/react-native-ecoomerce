// src/screens/OrdersScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { formatPrice } from '../utils/currency';

// ---- Temporary mock data (replace with TanStack Query later) ----
const ORDERS = [
  {
    id: 'ORD-1024',
    date: 'Sep 2, 2026',
    status: 'delivered',
    total: 189.98,
    itemCount: 3,
    thumbnail: 'https://picsum.photos/seed/p1/200/200',
  },
  {
    id: 'ORD-1023',
    date: 'Aug 28, 2026',
    status: 'shipped',
    total: 59.99,
    itemCount: 1,
    thumbnail: 'https://picsum.photos/seed/p2/200/200',
  },
  {
    id: 'ORD-1022',
    date: 'Aug 20, 2026',
    status: 'processing',
    total: 129.99,
    itemCount: 2,
    thumbnail: 'https://picsum.photos/seed/p3/200/200',
  },
  {
    id: 'ORD-1021',
    date: 'Aug 10, 2026',
    status: 'cancelled',
    total: 45.0,
    itemCount: 1,
    thumbnail: 'https://picsum.photos/seed/p4/200/200',
  },
];
// -----------------------------------------------------------------

type Order = (typeof ORDERS)[number];
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
  string,
  { label: string; color: string; bg: string; icon: IoniconName }
> = {
  processing: { label: 'Processing', color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  shipped: { label: 'Shipped', color: '#2563EB', bg: '#DBEAFE', icon: 'cube-outline' },
  delivered: { label: 'Delivered', color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
};

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return ORDERS;
    return ORDERS.filter((o) => o.status === activeFilter);
  }, [activeFilter]);

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
    const config = STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('OrderDetails', { id: item.id })}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.orderThumbnail}
          contentFit="cover"
          transition={200}
        />

        <View style={styles.orderInfo}>
          <View style={styles.orderTopRow}>
            <Text style={styles.orderId}>{item.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon} size={12} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>

          <Text style={styles.orderDate}>{item.date}</Text>

          <View style={styles.orderBottomRow}>
            <Text style={styles.orderMeta}>
              {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.orderTotal}>{formatPrice(item.total)}</Text>
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

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No orders here</Text>
          <Text style={styles.emptySubtitle}>
            Orders with this status will show up here
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
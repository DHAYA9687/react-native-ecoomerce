// src/screens/WishlistScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { WishlistItem, useWishlistStore } from '../store/wishlistStore';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 16 * 2 - CARD_GAP) / 2;

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400?text=No+Image';

export default function WishlistScreen() {
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.user?.id);

  const items = useWishlistStore((state) => state.items);
  const isLoading = useWishlistStore((state) => state.isLoading);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  const [removingId, setRemovingId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchWishlist(userId).catch((err) => console.error('Fetch wishlist error:', err));
      }
    }, [userId, fetchWishlist])
  );

  const handleRemove = async (item: WishlistItem) => {
    setRemovingId(item.product.id);
    try {
      await removeFromWishlist(userId as number, item.product.id);
    } catch (err) {
      Alert.alert('Something went wrong', 'Could not remove this item from your wishlist.');
    } finally {
      setRemovingId(null);
    }
  };

  const renderItem = ({ item }: { item: WishlistItem }) => {
    const { product } = item;
    const isRemoving = removingId === product.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ProductDetails', { id: product.id, product })}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: product.imageUrl || PLACEHOLDER_IMAGE }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemove(item)}
            disabled={isRemoving}
            hitSlop={8}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="heart" size={18} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart on any product to save it here
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Products' })}
          >
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  gridContent: { paddingHorizontal: 16, paddingBottom: 24 },
  columnWrapper: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  imageWrapper: {
    width: '100%',
    height: CARD_WIDTH - 16,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: { width: '100%', height: '100%', backgroundColor: '#F3F4F6' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '700', color: '#111827' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  shopBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  shopBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

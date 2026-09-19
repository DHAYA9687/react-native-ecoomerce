// src/screens/HomeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Category, Product, useProductStore } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';

const { width } = Dimensions.get('window');

// ---- Temporary mock data (replace with TanStack Query later) ----


const BANNERS = [
  { id: '1', image: 'https://picsum.photos/seed/banner1/800/400', title: 'Big Sale', subtitle: 'Up to 50% off' },
  { id: '2', image: 'https://picsum.photos/seed/banner2/800/400', title: 'New Arrivals', subtitle: 'Shop the latest' },
];

const ALL_CATEGORY_ID = 'all';


// -------------------------------------------------------------



export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const category = useProductStore((state) => state.categories);
  const categoryFilters = useMemo<Array<Pick<Category, 'name'> & { id: string | number }>>(
    () => [{ id: ALL_CATEGORY_ID, name: 'All' }, ...category],
    [category]
  );
  const products = useProductStore((state) => state.products);
  const isCategoryLoading = useProductStore((state) => state.isLoadingCategories);
  const isProductLoading = useProductStore((state) => state.isLoadingProducts);
  const fetchCategories = useProductStore((state) => state.fetchCategories);
  const fetchProducts = useProductStore((state) => state.fetchProduct);

  const userId = useAuthStore((state) => state.user?.id);
  const user = useAuthStore((state) => state.user);
  const displayName = user?.username || user?.email?.split('@')[0] || 'there';
  const cartItems = useCartStore((state) => state.items);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const wishlistItems = useWishlistStore((state) => state.items);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const [pendingWishlistId, setPendingWishlistId] = useState<number | null>(null);

  const wishlistedIds = useMemo(
    () => new Set(wishlistItems.map((item) => item.product.id)),
    [wishlistItems]
  );

  useEffect(() => {
    fetchCategories().catch((err) => console.error('Fetch Categories error:', err));
    fetchProducts().catch((err) => console.error('Fetch Products error:', err));
  }, [fetchCategories, fetchProducts]);

  useEffect(() => {
    if (userId) {
      fetchCart(userId).catch((err) => console.error('Fetch cart error:', err));
    }
  }, [userId, fetchCart]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchWishlist(userId).catch((err) => console.error('Fetch wishlist error:', err));
      }
    }, [userId, fetchWishlist])
  );

  const handleToggleWishlist = async (product: Product) => {
    if (!userId) {
      Alert.alert('Please sign in', 'You need to be signed in to save favourites.');
      return;
    }

    setPendingWishlistId(product.id);
    try {
      if (wishlistedIds.has(product.id)) {
        await removeFromWishlist(userId, product.id);
      } else {
        await addToWishlist(userId, product.id);
      }
    } catch (err) {
      Alert.alert('Something went wrong', 'Could not update your wishlist.');
    } finally {
      setPendingWishlistId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchCategories().catch((err) => console.error('Fetch Categories error:', err)),
        fetchProducts().catch((err) => console.error('Fetch Products error:', err)),
      ]);
    } finally {
      setRefreshing(false);
      setActiveCategory(null); // Reset active category on refresh
    }
  };


  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCategory) {
      list = list.filter((p) => String(p.category?.id) === activeCategory);
    }

    if (search.trim()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    return list;
  }, [products, activeCategory, search]);

  const renderCategory = ({ item }: { item: { id: string | number; name: string } }) => {
    const isAll = item.id === ALL_CATEGORY_ID;
    const isActive = isAll ? activeCategory === null : activeCategory === String(item.id);

    return (
      <TouchableOpacity
        style={[styles.categoryPill, isActive && styles.categoryPillActive]}
        onPress={() => setActiveCategory(isAll ? null : String(item.id))}
      >
        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBanner = ({ item }: { item: (typeof BANNERS)[number] }) => (
    <View style={styles.bannerCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.bannerImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const isWishlisted = wishlistedIds.has(item.id);
    const isWishlistPending = pendingWishlistId === item.id;

    return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetails', { id: item.id, product: item })}
      activeOpacity={0.8}
    >
      <View style={styles.productImageWrapper}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => handleToggleWishlist(item)}
          disabled={isWishlistPending}
          hitSlop={8}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? '#EF4444' : '#1F2937'}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.productName} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.productMetaRow}>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        {item.stockQuantity <= 0 && (
          <Text style={styles.outOfStockText}>Out of stock</Text>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
          <Text style={styles.greetingSub}>Find what you love</Text>
        </View>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={22} color="#1F2937" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          placeholder="Search products..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity>
          <Ionicons name="options-outline" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
      >
        {/* Categories */}
        <FlatList
          data={categoryFilters}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCategory}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />

        {/* Banners */}
        <FlatList
          data={BANNERS}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBanner}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannerList}
        />

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Products')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Product grid */}
        {activeCategory && filteredProducts.length === 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>
              No products found in this category.
            </Text>
          </View>
        )}

        <View style={styles.productGrid}>
          {filteredProducts.map((item) => (
            <View key={String(item.id)} style={styles.productGridItem}>
              {renderProduct({ item })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const CARD_GAP = 12;
const CARD_WIDTH = (width - 16 * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  greetingSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  bannerList: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  bannerCard: {
    width: width - 32,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
  },
  bannerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 14,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: '#E5E7EB',
    fontSize: 13,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  productGridItem: {
    width: CARD_WIDTH,
    marginBottom: CARD_GAP,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  productImageWrapper: {
    width: '100%',
    height: CARD_WIDTH - 16,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  wishlistBtn: {
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
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
});
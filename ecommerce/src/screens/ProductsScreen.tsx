// src/screens/ProductsScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useProductStore, Product, Category } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';

const { width } = Dimensions.get('window');

const SORT_OPTIONS = ['Popular', 'Price: Low to High', 'Price: High to Low', 'Rating'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];


type CategoryFilter = number | 'all';
type CategoryPill = { id: CategoryFilter; name: string };

const ALL_PILL: CategoryPill = { id: 'all', name: 'All' };

export default function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('Popular');
  const [showSort, setShowSort] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const fetchProducts = useProductStore((state) => state.fetchProduct);
  const fetchCategories = useProductStore((state) => state.fetchCategories);
  const products = useProductStore((state) => state.products);
  const categories = useProductStore((state) => state.categories);
  const isProductLoading = useProductStore((state) => state.isLoadingProducts);
  const isCategoryLoading = useProductStore((state) => state.isLoadingCategories);

  const userId = useAuthStore((state) => state.user?.id);
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
    fetchProducts().catch((err) => console.error('Fetch Products error:', err));
    fetchCategories().catch((err) => console.error('Fetch Categories error:', err));
  }, [fetchProducts, fetchCategories]);

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


  const isRefreshing = isProductLoading || isCategoryLoading;

  const handleRefresh = () => {
    fetchProducts().catch((err) => console.error('Fetch Products error:', err));
    fetchCategories().catch((err) => console.error('Fetch Categories error:', err));
  };

  const categoryPills: CategoryPill[] = useMemo(
    () => [ALL_PILL, ...categories.map((c) => ({ id: c.id, name: c.name }))],
    [categories]
  );

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCategory !== 'all') {
      list = list.filter((p) => p.category?.id === activeCategory);
    }

    if (search.trim()) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    switch (sortBy) {
      case 'Price: Low to High':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'Rating':
        // NOTE: Product has no `rating` field yet — this is a no-op until
        // your backend/type adds one. Falling back to 0 keeps it from crashing.
        list.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default:
        break;
    }

    return list;
  }, [search, activeCategory, sortBy, products]);

  const renderCategory = ({ item }: { item: CategoryPill }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        activeCategory === item.id && styles.categoryPillActive,
      ]}
      onPress={() => setActiveCategory(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          activeCategory === item.id && styles.categoryTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const isWishlisted = wishlistedIds.has(item.id);
    const isWishlistPending = pendingWishlistId === item.id;

    return (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductDetails', { id: item.id, product: item })}
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
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.ratingText}>{(item as any).rating ?? '—'}</Text>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <View>
          <Text style={styles.headerTitle}>Products</Text>
          <Text style={styles.headerCount}>{filteredProducts.length} items</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setShowSort((prev) => !prev)}
          >
            <Ionicons name="swap-vertical-outline" size={16} color="#111827" />
            <Text style={styles.sortBtnText}>{sortBy}</Text>
            <Ionicons
              name={showSort ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#111827"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddProduct')}
            hitSlop={8}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
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
      </View>

      {/* Categories */}
      <FlatList
        data={categoryPills}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCategory}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryListWrapper}
        contentContainerStyle={styles.categoryList}
      />

      {/* Product grid */}
      {isProductLoading && products.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Loading products…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={filteredProducts.length > 0 ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#111827" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search or category
              </Text>
            </View>
          }
        />
      )}

      {/* Sort dropdown — floats above everything else so it never pushes
          the search bar / category filters out of place */}
      {showSort && (
        <>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowSort(false)}
          />
          <View style={[styles.sortDropdown, { top: headerHeight + 8 }]}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.sortOption}
                onPress={() => {
                  setSortBy(option);
                  setShowSort(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option && styles.sortOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
                {sortBy === option && (
                  <Ionicons name="checkmark" size={16} color="#111827" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const CARD_GAP = 12;
const CARD_WIDTH = (width - 16 * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerCount: { fontSize: 13, color: '#9CA3AF' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  categoryPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  categoryText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: '#111827' },
  sortDropdown: {
    position: 'absolute',
    right: 16,
    minWidth: 200,
    zIndex: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionText: { fontSize: 13, color: '#4B5563' },
  sortOptionTextActive: { color: '#111827', fontWeight: '700' },
  gridContent: { paddingHorizontal: 16, paddingBottom: 24 },
  columnWrapper: { gap: CARD_GAP, marginBottom: CARD_GAP },
  productCard: {
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
  productImageWrapper: {
    width: '100%',
    height: CARD_WIDTH - 16,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  productImage: { width: '100%', height: '100%' },
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
  productName: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 },
  productMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 12, color: '#6B7280' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  categoryListWrapper: { flexGrow: 0, height: 44, marginBottom: 12 },
  categoryList: { paddingHorizontal: 16, gap: 10, alignItems: 'center' },
});
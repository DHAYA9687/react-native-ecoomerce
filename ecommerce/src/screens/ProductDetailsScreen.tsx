// src/screens/ProductDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Product, useProductStore } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

const { width } = Dimensions.get('window');

const PLACEHOLDER_IMAGE = 'https://placehold.co/800x800?text=No+Image';

export default function ProductDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { id, product: productParam } = (route.params ?? {}) as {
    id?: number | string;
    product?: Product;
  };

  const products = useProductStore((state) => state.products);
  const isProductLoading = useProductStore((state) => state.isLoadingProducts);
  const fetchProducts = useProductStore((state) => state.fetchProduct);

  // If we weren't handed the full product (e.g. deep link) and the store
  // hasn't loaded products yet, fetch so we can look it up by id.
  useEffect(() => {
    if (!productParam && products.length === 0) {
      fetchProducts().catch((err) => console.error('Fetch Products error:', err));
    }
  }, [productParam, products.length, fetchProducts]);

  const product: Product | undefined =
    productParam ?? products.find((p) => String(p.id) === String(id));

  const userId = useAuthStore((state) => state.user?.id);
  const addToCart = useCartStore((state) => state.addToCart);

  const [quantity, setQuantity] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const inStock = (product?.stockQuantity ?? 0) > 0;
  const imageUri = product?.imageUrl || PLACEHOLDER_IMAGE;

  const handleAddToCart = async () => {
    if (!product || !inStock) return;

    if (!userId) {
      Alert.alert('Please sign in', 'You need to be signed in to add items to your cart.');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(userId, product.id, quantity);
      // ProductDetails lives on the root stack, outside the tab navigator
      // that owns the 'Cart' screen - navigate() can't resolve 'Cart'
      // directly from here, so target it through 'MainTabs'.
      navigation.navigate('MainTabs', { screen: 'Cart' });
    } catch (err) {
      console.error('Add to cart error:', err);
      Alert.alert('Something went wrong', 'Could not add this item to your cart.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const header = (
    <View style={[styles.header, { top: insets.top + 8 }]}>
      <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color="#111827" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.headerBtn}
        onPress={() => setIsWishlisted((prev) => !prev)}
      >
        <Ionicons
          name={isWishlisted ? 'heart' : 'heart-outline'}
          size={20}
          color={isWishlisted ? '#EF4444' : '#111827'}
        />
      </TouchableOpacity>
    </View>
  );

  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {header}
        <View style={styles.centerState}>
          {isProductLoading ? (
            <ActivityIndicator size="large" color="#111827" />
          ) : (
            <Text style={styles.notFoundText}>Product not found.</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {header}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product image */}
        <Image
          source={{ uri: imageUri }}
          style={styles.mainImage}
          contentFit="cover"
          transition={200}
        />

        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={styles.name}>{product.name}</Text>
            {!inStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockBadgeText}>Out of stock</Text>
              </View>
            )}
          </View>

          {(product.brand || product.category?.name) && (
            <View style={styles.metaRow}>
              {product.brand && <Text style={styles.metaText}>{product.brand}</Text>}
              {product.brand && product.category?.name && (
                <Text style={styles.metaDot}>•</Text>
              )}
              {product.category?.name && (
                <Text style={styles.metaText}>{product.category.name}</Text>
              )}
            </View>
          )}

          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: inStock ? '#10B981' : '#EF4444' },
              ]}
            />
            <Text style={styles.stockText}>
              {inStock ? `In Stock (${product.stockQuantity} available)` : 'Out of Stock'}
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          </View>

          {/* Quantity */}
          <Text style={styles.sectionLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={!inStock}
            >
              <Ionicons name="remove" size={16} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() =>
                setQuantity((q) => Math.min(product.stockQuantity || q, q + 1))
              }
              disabled={!inStock}
            >
              <Ionicons name="add" size={16} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.sectionLabel}>Description</Text>
          <Text
            style={styles.description}
            numberOfLines={descExpanded ? undefined : 3}
          >
            {product.description || 'No description available for this product.'}
          </Text>
          {!!product.description && product.description.length > 120 && (
            <TouchableOpacity onPress={() => setDescExpanded((prev) => !prev)}>
              <Text style={styles.readMore}>
                {descExpanded ? 'Show less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}

          {/* SKU */}
          {product.sku && (
            <>
              <Text style={styles.sectionLabel}>SKU</Text>
              <Text style={styles.description}>{product.sku}</Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky add-to-cart bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceBlock}>
          <Text style={styles.bottomPriceLabel}>Total Price</Text>
          <Text style={styles.bottomPrice}>
            ${(product.price * quantity).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addToCartBtn,
            (!inStock || isAddingToCart) && styles.addToCartBtnDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={!inStock || isAddingToCart}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text style={styles.addToCartText}>
                {inStock ? 'Add to Cart' : 'Unavailable'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  mainImage: {
    width,
    height: width,
    backgroundColor: '#F3F4F6',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginRight: 12,
  },
  outOfStockBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaDot: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  stepperBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    minWidth: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },
  readMore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 6,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  bottomPriceBlock: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addToCartBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

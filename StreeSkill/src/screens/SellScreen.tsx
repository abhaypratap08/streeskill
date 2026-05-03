import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ProductListing } from '../types';
import { parseProductPrice, validateProductListing } from '../utils/validation';
import SuccessPopup from '../components/SuccessPopup';
import { COLORS, SIZES } from '../constants/theme';
import { marketplaceApi, analyticsApi, Earnings } from '../services/api';

export default function SellScreen() {
  const [listing, setListing] = useState<ProductListing>({
    image: null,
    name: '',
    description: '',
    price: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState<Earnings | null>(null);

  useEffect(() => {
    loadEarnings();
    analyticsApi.trackEvent(analyticsApi.events.SCREEN_VIEW, { screen: 'Sell' });
  }, []);

  const loadEarnings = async () => {
    try {
      const result = await marketplaceApi.getEarnings();
      if (result.success && result.data) {
        setEarnings(result.data);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setListing({ ...listing, image: result.assets[0].uri });
    }
  };

  const handleSubmit = async () => {
    if (!validateProductListing(listing)) {
      Alert.alert('Invalid Listing', 'Please add a photo, name, and a valid price greater than zero');
      return;
    }

    const price = parseProductPrice(listing.price);
    if (price === undefined) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than zero');
      return;
    }
    
    setLoading(true);
    try {
      const result = await marketplaceApi.createProduct({
        title: listing.name,
        description: listing.description,
        price,
        images: listing.image ? [listing.image] : [],
        category: 'Handmade',
      });
      
      if (result.success) {
        analyticsApi.trackEvent(analyticsApi.events.PRODUCT_LIST, { productId: result.data?.id });
        setShowSuccess(true);
      } else {
        Alert.alert('Error', result.error || 'Could not list product');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setListing({ image: null, name: '', description: '', price: '' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>List on Meesho</Text>
          <Text style={styles.headerSubtitle}>Sell your handmade products</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {listing.image ? (
              <Image source={{ uri: listing.image }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Handmade Blouse"
              placeholderTextColor={COLORS.gray}
              value={listing.name}
              onChangeText={(text) => setListing({ ...listing, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product..."
              placeholderTextColor={COLORS.gray}
              value={listing.description}
              onChangeText={(text) => setListing({ ...listing, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 500"
              placeholderTextColor={COLORS.gray}
              value={listing.price}
              onChangeText={(text) => setListing({ ...listing, price: text })}
              keyboardType="numeric"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>List Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SuccessPopup visible={showSuccess} onClose={handleCloseSuccess} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: SIZES.cardRadius,
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.screenBg,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.screenBg,
    opacity: 0.8,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.cardRadius,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: COLORS.screenBg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.darkGray,
    backgroundColor: COLORS.screenBg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: COLORS.screenBg,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

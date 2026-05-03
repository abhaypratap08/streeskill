import { ProductListing } from '../types';

const PRICE_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export const parseProductPrice = (price: string): number | undefined => {
  const normalizedPrice = price.trim();
  if (!PRICE_PATTERN.test(normalizedPrice)) {
    return undefined;
  }

  const parsedPrice = Number(normalizedPrice);
  return Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined;
};

export const validateProductListing = (listing: ProductListing): boolean => {
  const hasImage = listing.image !== null && listing.image.trim() !== '';
  const hasName = listing.name.trim() !== '';
  const hasPrice = parseProductPrice(listing.price) !== undefined;
  
  return hasImage && hasName && hasPrice;
};

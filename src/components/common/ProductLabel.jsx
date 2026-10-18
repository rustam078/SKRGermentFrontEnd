import React, { useState } from 'react';
import { productService } from '../../services/productService';
import { getProductIconAndLabel } from '../../utils/product-icons';

/**
 * Shows a product's uploaded image as a small thumbnail next to its name.
 * Falls back to the emoji icon + name when there is no image (or it fails to load).
 */
const ProductLabel = ({ productId, iconName, name, hasImage, size = 22, nameStyle }) => {
  const [failed, setFailed] = useState(false);
  const showImage = !!productId && hasImage !== false && !failed;

  if (!showImage) {
    // No image → keep the existing emoji icon + name look.
    return <span style={nameStyle}>{getProductIconAndLabel(iconName, name || 'Product')}</span>;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <img
        src={productService.imageUrl(productId)}
        onError={() => setFailed(true)}
        alt=""
        style={{
          width: size, height: size, borderRadius: 6, objectFit: 'cover',
          flexShrink: 0, border: '1px solid #E2E8F0', background: '#fff',
        }}
      />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', ...nameStyle }}>{name || 'Product'}</span>
    </span>
  );
};

export default ProductLabel;

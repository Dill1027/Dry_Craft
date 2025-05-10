import { getImageUrl } from '../utils/imageUtils';

function Product({ product }) {
    const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';
    
    return (
        <div>
            {product.imageUrl && (
                <img 
                    src={getImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                        // Log error for debugging
                        console.warn('Image failed to load:', e.target.src);
                        // Set fallback image
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = PLACEHOLDER_IMAGE;
                    }}
                />
            )}
        </div>
    );
}

export default Product;
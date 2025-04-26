import { getImageUrl } from '../utils/imageUtils';

function Product({ product }) {
    return (
        <div>
            {product.imageUrl && (
                <img 
                    src={getImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        e.target.src = getImageUrl('/api/images/placeholder.jpg');
                    }}
                />
            )}
        </div>
    );
}

export default Product;
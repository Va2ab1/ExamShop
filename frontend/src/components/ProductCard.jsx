import { Link } from 'react-router-dom'
import './ProductCard.css'

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <div className="product-image">
        <div className="product-placeholder">
          📄
        </div>
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        
        <div className="product-footer">
          <div className="product-price">{product.price}₽</div>
          <Link to={`/products/${product.id}`}>
            <button className="product-btn primary">Купить</button>
          </Link>
        </div>
        
        {product.stock !== undefined && (
          <div className="product-stock">
            В наличии: {product.stock} шт.
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard

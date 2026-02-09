import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/api'
import ReviewForm from '../components/ReviewForm'
import './ProductDetail.css'

const ProductDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProductData()
  }, [id])

  const loadProductData = async () => {
    setLoading(true)
    try {
      const [productData, reviewsData] = await Promise.all([
        api.getProductById(id),
        api.getReviewsByProduct(id)
      ])
      setProduct(productData)
      setReviews(reviewsData)
    } catch (error) {
      console.error('Failed to load product:', error)
      setMessage('Ошибка загрузки товара')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setAddingToCart(true)
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const existingItem = cart.find(item => item.productId === parseInt(id))
      
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        cart.push({
          productId: parseInt(id),
          quantity,
          price: product.price,
          name: product.name
        })
      }
      
      localStorage.setItem('cart', JSON.stringify(cart))
      setMessage('✓ Товар добавлен в корзину!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Ошибка добавления в корзину')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleReviewAdded = () => {
    loadProductData()
  }

  if (loading) {
    return <div className="loading">Загрузка товара...</div>
  }

  if (!product) {
    return (
      <div className="container">
        <div className="error-message">Товар не найден</div>
      </div>
    )
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        {message && (
          <div className={`alert ${message.includes('✓') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="product-detail">
          <div className="product-image-large">
            <div className="image-placeholder">📄</div>
          </div>

          <div className="product-info-section">
            <h1>{product.name}</h1>
            <p className="product-description-full">{product.description}</p>

            <div className="product-price-large">{product.price}₽</div>

            {product.stock !== undefined && (
              <div className="product-stock-info">
                {product.stock > 0 ? (
                  <span className="in-stock">✓ В наличии: {product.stock} шт.</span>
                ) : (
                  <span className="out-of-stock">✗ Нет в наличии</span>
                )}
              </div>
            )}

            <div className="quantity-section">
              <label>Количество:</label>
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="quantity-btn"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="quantity-input"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={addingToCart || (product.stock !== undefined && product.stock < 1)}
              className="primary add-to-cart-btn"
            >
              {addingToCart ? 'Добавление...' : 'Добавить в корзину'}
            </button>

            <div className="product-hint">
              💡 Challenge #22: Попробуйте изменить цену в корзине
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <h2>Отзывы ({reviews.length})</h2>

          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="review-author">{review.username}</div>
                    <div className="review-rating">
                      {'⭐'.repeat(review.rating)}
                    </div>
                  </div>
                  <div 
                    className="review-comment"
                    dangerouslySetInnerHTML={{ __html: review.comment }}
                  />
                  <div className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-reviews">Пока нет отзывов. Будьте первым!</p>
          )}

          {user && <ReviewForm productId={id} onReviewAdded={handleReviewAdded} />}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

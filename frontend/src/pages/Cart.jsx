import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/api'
import './Cart.css'

const Cart = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadCart()
  }, [user, navigate])

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(cartData)
  }

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return
    const updatedCart = [...cart]
    updatedCart[index].quantity = newQuantity
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const updatePrice = (index, newPrice) => {
    const updatedCart = [...cart]
    updatedCart[index].price = parseFloat(newPrice) || 0
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const removeItem = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index)
    setCart(updatedCart)
    localStorage.setItem('cart', JSON.stringify(updatedCart))
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal - (subtotal * discount / 100)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setMessage('Корзина пуста')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }))

      const order = await api.createOrder(items, couponCode || null)
      
      localStorage.setItem('cart', '[]')
      setCart([])
      setMessage(`✓ Заказ #${order.id} успешно создан!`)
      
      setTimeout(() => {
        navigate('/profile')
      }, 2000)
    } catch (error) {
      setMessage(error.message || 'Ошибка при создании заказа')
    } finally {
      setLoading(false)
    }
  }

  const applyCouponCode = () => {
    if (couponCode.toUpperCase() === 'DISCOUNT10') {
      setDiscount(10)
      setMessage('✓ Промокод применён! Скидка 10%')
    } else if (couponCode.toUpperCase() === 'DISCOUNT50') {
      setDiscount(50)
      setMessage('✓ Промокод применён! Скидка 50%')
    } else {
      setMessage('Неверный промокод')
      setDiscount(0)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Корзина</h1>

        {message && (
          <div className={`alert ${message.includes('✓') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="empty-cart">
            <h2>Ваша корзина пуста</h2>
            <p>Добавьте товары из каталога</p>
            <button onClick={() => navigate('/products')} className="primary">
              Перейти к товарам
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="item-info">
                    <h3>{item.name}</h3>
                  </div>

                  <div className="item-controls">
                    <div className="quantity-control">
                      <label>Количество:</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                        min="1"
                        className="quantity-input-small"
                      />
                    </div>

                    <div className="price-control">
                      <label>Цена:</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updatePrice(index, e.target.value)}
                        min="0"
                        step="0.01"
                        className="price-input"
                      />
                      <span className="currency">₽</span>
                    </div>

                    <div className="item-total">
                      Итого: <strong>{(item.price * item.quantity).toFixed(2)}₽</strong>
                    </div>

                    <button
                      onClick={() => removeItem(index)}
                      className="danger remove-btn"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}

              <div className="cart-hint">
                💡 Challenge #22: Попробуйте изменить цену товара прямо в корзине
              </div>
            </div>

            <div className="cart-summary">
              <h2>Итого</h2>

              <div className="summary-row">
                <span>Подытог:</span>
                <span>{calculateSubtotal().toFixed(2)}₽</span>
              </div>

              {discount > 0 && (
                <div className="summary-row discount">
                  <span>Скидка ({discount}%):</span>
                  <span>-{(calculateSubtotal() * discount / 100).toFixed(2)}₽</span>
                </div>
              )}

              <div className="summary-row total">
                <span>Всего:</span>
                <span>{calculateTotal().toFixed(2)}₽</span>
              </div>

              <div className="coupon-section">
                <label>Промокод:</label>
                <div className="coupon-input-group">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Введите промокод"
                  />
                  <button onClick={applyCouponCode}>
                    Применить
                  </button>
                </div>
                <div className="coupon-hint">
                  💡 Попробуйте: DISCOUNT10, DISCOUNT50
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="primary checkout-btn"
              >
                {loading ? 'Оформление...' : 'Оформить заказ'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart

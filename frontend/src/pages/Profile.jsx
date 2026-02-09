import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/api'
import './Profile.css'

const Profile = () => {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ username: '', email: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const userId = searchParams.get('userId')
    if (userId) {
      loadUserProfile(userId)
    } else {
      loadOwnProfile()
    }
  }, [user, navigate, searchParams])

  const loadOwnProfile = async () => {
    setLoading(true)
    try {
      const [profileData, ordersData] = await Promise.all([
        api.getProfile(),
        api.getAllOrders()
      ])
      setProfile(profileData)
      setOrders(ordersData)
      setFormData({
        username: profileData.username,
        email: profileData.email
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
      setMessage('Ошибка загрузки профиля')
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async (userId) => {
    setLoading(true)
    try {
      const profileData = await api.getUserById(userId)
      setProfile(profileData)
      setFormData({
        username: profileData.username,
        email: profileData.email
      })
      setMessage(`💡 Challenge #12: IDOR - Вы просматриваете профиль пользователя #${userId}`)
    } catch (error) {
      console.error('Failed to load user profile:', error)
      setMessage('Ошибка загрузки профиля пользователя')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      await api.updateProfile(formData)
      await refreshUser()
      setEditing(false)
      setMessage('✓ Профиль успешно обновлён')
      loadOwnProfile()
    } catch (error) {
      setMessage(error.message || 'Ошибка обновления профиля')
    }
  }

  if (loading) {
    return <div className="loading">Загрузка профиля...</div>
  }

  if (!profile) {
    return (
      <div className="container">
        <div className="error-message">Профиль не найден</div>
      </div>
    )
  }

  const isOwnProfile = !searchParams.get('userId')

  return (
    <div className="profile-page">
      <div className="container">
        <h1>Профиль пользователя</h1>

        {message && (
          <div className={`alert ${message.includes('✓') ? 'success' : 'info'}`}>
            {message}
          </div>
        )}

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar">
              👤
            </div>

            {editing && isOwnProfile ? (
              <form onSubmit={handleUpdate} className="profile-form">
                <div className="form-group">
                  <label>Имя пользователя</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="primary">
                    Сохранить
                  </button>
                  <button type="button" onClick={() => setEditing(false)}>
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Имя пользователя:</span>
                  <span className="info-value">{profile.username}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{profile.email}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Роль:</span>
                  <span className="info-value">
                    <span className={`badge ${profile.role === 'admin' ? 'warning' : 'info'}`}>
                      {profile.role}
                    </span>
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Баллы:</span>
                  <span className="info-value score">{profile.score || 0}</span>
                </div>

                {isOwnProfile && (
                  <button onClick={() => setEditing(true)} className="primary edit-btn">
                    Редактировать профиль
                  </button>
                )}
              </div>
            )}
          </div>

          {isOwnProfile && (
            <div className="orders-section">
              <h2>История заказов</h2>

              {orders.length > 0 ? (
                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <span className="order-id">Заказ #{order.id}</span>
                        <span className={`badge ${order.status === 'completed' ? 'success' : 'warning'}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="order-info">
                        <div className="order-row">
                          <span>Сумма:</span>
                          <span className="order-total">{order.total}₽</span>
                        </div>
                        <div className="order-row">
                          <span>Дата:</span>
                          <span>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                        {order.items && (
                          <div className="order-items">
                            <strong>Товары:</strong>
                            <ul>
                              {order.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.quantity}x - {item.price}₽
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-orders">
                  <p>У вас пока нет заказов</p>
                  <button onClick={() => navigate('/products')} className="primary">
                    Перейти к покупкам
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="profile-hints">
          <div className="hint-box">
            <h4>💡 Подсказки для тестирования</h4>
            <p>Challenge #12: IDOR - Попробуйте изменить параметр userId в URL</p>
            <p className="hint-example">Например: /profile?userId=1, /profile?userId=2</p>
            <p>Challenge #25: Попробуйте изменить свою роль через обновление профиля</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

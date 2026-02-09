import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/api'
import './Admin.css'

const Admin = () => {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [dashboardData, usersData] = await Promise.all([
        api.getAdminDashboard(),
        api.getUsers()
      ])
      setDashboard(dashboardData)
      setUsers(usersData)
      
      if (!user || user.role !== 'admin') {
        setMessage('⚠️ Challenge #13: Broken Access Control - Вы получили доступ без прав администратора!')
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
      setMessage('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole)
      setMessage(`✓ Роль пользователя успешно обновлена`)
      loadAdminData()
    } catch (error) {
      setMessage(error.message || 'Ошибка обновления роли')
    }
  }

  if (loading) {
    return <div className="loading">Загрузка панели администратора...</div>
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>🔐 Админ-панель</h1>
          <p className="admin-subtitle">Панель управления ExamShop</p>
        </div>

        {message && (
          <div className={`alert ${message.includes('✓') ? 'success' : 'warning'}`}>
            {message}
          </div>
        )}

        {dashboard && (
          <div className="dashboard-stats">
            <div className="stat-box">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{dashboard.totalUsers || 0}</div>
              <div className="stat-label">Пользователей</div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{dashboard.totalProducts || 0}</div>
              <div className="stat-label">Товаров</div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">🛒</div>
              <div className="stat-value">{dashboard.totalOrders || 0}</div>
              <div className="stat-label">Заказов</div>
            </div>

            <div className="stat-box">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{dashboard.totalRevenue || 0}₽</div>
              <div className="stat-label">Выручка</div>
            </div>
          </div>
        )}

        <div className="users-section">
          <h2>Управление пользователями</h2>

          {users.length > 0 ? (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Имя пользователя</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Баллы</th>
                    <th>Дата регистрации</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td className="username-cell">{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'warning' : 'info'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="score-cell">{u.score || 0}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">Нет пользователей</p>
          )}
        </div>

        <div className="admin-hints">
          <div className="hint-box">
            <h4>💡 Подсказки для тестирования</h4>
            <p>Challenge #13: Broken Access Control - Эта панель доступна без проверки прав администратора</p>
            <p>Challenge #25: Попробуйте повысить свою роль до admin</p>
            <p>Challenge #28: Изучите уязвимость Mass Assignment</p>
          </div>
        </div>

        <div className="danger-zone">
          <h3>⚠️ Опасная зона</h3>
          <p>Действия в этом разделе могут повлиять на всех пользователей</p>
          <div className="danger-actions">
            <button className="danger" onClick={() => setMessage('Функция в разработке')}>
              Удалить все заказы
            </button>
            <button className="danger" onClick={() => setMessage('Функция в разработке')}>
              Сбросить все баллы
            </button>
            <button className="danger" onClick={() => setMessage('Функция в разработке')}>
              Экспорт данных
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin

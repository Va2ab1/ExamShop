import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Register.css'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)

    try {
      await register(username, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <div className="container">
        <div className="register-container">
          <div className="register-card">
            <div className="register-header">
              <h1>Регистрация</h1>
              <p className="register-subtitle">Создайте аккаунт для доступа к челленджам</p>
            </div>

            {error && (
              <div className="alert error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label>Имя пользователя</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Выберите имя пользователя"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введите email"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  autoComplete="new-password"
                />
                <small className="form-hint">
                  💡 Слабые пароли разрешены (Challenge #27)
                </small>
              </div>

              <div className="form-group">
                <label>Подтвердите пароль</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  required
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" disabled={loading} className="primary register-btn">
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>

            <div className="register-footer">
              <p>
                Уже есть аккаунт? <Link to="/login">Войти</Link>
              </p>
            </div>

            <div className="register-info">
              <div className="info-box">
                <h4>ℹ️ Информация</h4>
                <ul>
                  <li>✓ Мгновенная регистрация</li>
                  <li>✓ Доступ ко всем 33 челленджам</li>
                  <li>✓ Отслеживание прогресса</li>
                  <li>✓ Таблица лидеров</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

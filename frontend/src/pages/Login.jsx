import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h1>Вход в систему</h1>
              <p className="login-subtitle">Получите доступ к ExamShop</p>
            </div>

            {error && (
              <div className="alert error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Имя пользователя</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите имя пользователя"
                  required
                  autoComplete="username"
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
                  autoComplete="current-password"
                />
              </div>

              <button type="submit" disabled={loading} className="primary login-btn">
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <div className="login-footer">
              <p>
                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
              </p>
            </div>

            <div className="login-hints">
              <div className="hint-box">
                <h4>💡 Подсказки для тестирования</h4>
                <p>Challenge #1: Попробуйте SQL-инъекцию в поле имени пользователя</p>
                <p className="hint-code">Например: admin' OR '1'='1</p>
                <p>Challenge #11: Слабые пароли разрешены</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

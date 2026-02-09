import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/api'
import ProductCard from '../components/ProductCard'
import ScoreBoard from '../components/ScoreBoard'
import './Home.css'

const Home = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsData, leaderboardData] = await Promise.all([
        api.getProducts(),
        api.getLeaderboard()
      ])
      
      setProducts(productsData.slice(0, 6))
      setLeaderboard(leaderboardData)
      
      if (user) {
        const statsData = await api.getStats()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Загрузка...</div>
  }

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="glitch" data-text=">_ ExamShop">&gt;_ ExamShop</span>
            </h1>
            <p className="hero-subtitle">
              Добро пожаловать в уязвимое веб-приложение для обучения
            </p>
            <p className="hero-description">
              Откройте для себя 33 челленджа по безопасности веб-приложений.
              Практикуйте SQL-инъекции, XSS, CSRF, IDOR и другие уязвимости в безопасной среде.
            </p>
            
            <div className="hero-stats">
              <div className="stat-card">
                <div className="stat-number">33</div>
                <div className="stat-label">Челленджа</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">10</div>
                <div className="stat-label">Категорий OWASP</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">∞</div>
                <div className="stat-label">Возможностей</div>
              </div>
            </div>
            
            <div className="hero-actions">
              {user ? (
                <>
                  <Link to="/challenges">
                    <button className="primary">Перейти к челленджам</button>
                  </Link>
                  <Link to="/products">
                    <button>Просмотреть товары</button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <button className="primary">Начать сейчас</button>
                  </Link>
                  <Link to="/login">
                    <button>Войти</button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {user && stats && (
        <section className="user-stats">
          <div className="container">
            <h2>Ваш прогресс</h2>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{stats.score || 0}</div>
                <div className="stat-text">Баллов заработано</div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats.solvedChallenges || 0} / 33</div>
                <div className="stat-text">Челленджей решено</div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">📈</div>
                <div className="stat-value">
                  {Math.round(((stats.solvedChallenges || 0) / 33) * 100)}%
                </div>
                <div className="stat-text">Прогресс</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="featured-products">
        <div className="container">
          <h2>Популярные товары</h2>
          <div className="grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-3">
            <Link to="/products">
              <button className="primary">Посмотреть все товары</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="leaderboard-section">
        <div className="container">
          <h2>Таблица лидеров</h2>
          <ScoreBoard entries={leaderboard} limit={5} />
          <div className="text-center mt-3">
            <Link to="/scoreboard">
              <button>Полная таблица лидеров</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="warning-section">
        <div className="container">
          <div className="warning-box">
            <h2>⚠️ ОБРАЗОВАТЕЛЬНОЕ ПРЕДУПРЕЖДЕНИЕ</h2>
            <p>
              Это приложение намеренно содержит серьезные уязвимости безопасности.
              Оно создано исключительно для образовательных целей.
            </p>
            <ul>
              <li>✗ НЕ используйте этот код в продакшене</li>
              <li>✗ НЕ размещайте в открытом интернете</li>
              <li>✓ Используйте только для обучения</li>
              <li>✓ Изучайте уязвимости в безопасной среде</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

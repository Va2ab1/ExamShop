import { useState, useEffect } from 'react'
import * as api from '../api/api'
import ScoreBoard from '../components/ScoreBoard'
import './ScoreBoardPage.css'

const ScoreBoardPage = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const data = await api.getLeaderboard()
      setLeaderboard(data)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredLeaderboard = () => {
    let filtered = [...leaderboard]
    
    if (filter === 'top10') {
      filtered = filtered.slice(0, 10)
    } else if (filter === 'top50') {
      filtered = filtered.slice(0, 50)
    }
    
    return filtered
  }

  if (loading) {
    return <div className="loading">Загрузка таблицы лидеров...</div>
  }

  const filteredData = getFilteredLeaderboard()
  const totalUsers = leaderboard.length
  const totalPoints = leaderboard.reduce((sum, entry) => sum + (entry.score || 0), 0)
  const avgScore = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0

  return (
    <div className="scoreboard-page">
      <div className="container">
        <div className="scoreboard-header">
          <h1>🏆 Таблица лидеров</h1>
          <p className="scoreboard-subtitle">
            Топ игроков по количеству решённых челленджей
          </p>
        </div>

        <div className="scoreboard-stats">
          <div className="stat-item">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{totalUsers}</div>
              <div className="stat-text">Участников</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">💎</div>
            <div className="stat-content">
              <div className="stat-number">{totalPoints.toLocaleString()}</div>
              <div className="stat-text">Всего баллов</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{avgScore}</div>
              <div className="stat-text">Средний балл</div>
            </div>
          </div>
        </div>

        <div className="filter-section">
          <button
            className={filter === 'all' ? 'primary' : ''}
            onClick={() => setFilter('all')}
          >
            Все участники
          </button>
          <button
            className={filter === 'top10' ? 'primary' : ''}
            onClick={() => setFilter('top10')}
          >
            Топ 10
          </button>
          <button
            className={filter === 'top50' ? 'primary' : ''}
            onClick={() => setFilter('top50')}
          >
            Топ 50
          </button>
        </div>

        <div className="scoreboard-container">
          {filteredData.length > 0 ? (
            <ScoreBoard entries={filteredData} limit={null} />
          ) : (
            <div className="no-data">
              <h3>Таблица лидеров пуста</h3>
              <p>Будьте первым! Решайте челленджи и зарабатывайте баллы.</p>
            </div>
          )}
        </div>

        <div className="scoreboard-info">
          <div className="info-card">
            <h3>📈 Как попасть в топ?</h3>
            <ul>
              <li>Решайте челленджи по безопасности</li>
              <li>Находите уязвимости в приложении</li>
              <li>Отправляйте правильные флаги</li>
              <li>Зарабатывайте баллы за каждый решённый челлендж</li>
              <li>Не используйте подсказки и решения для максимального счёта</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>🎯 Система начисления баллов</h3>
            <ul>
              <li>⭐ Лёгкий челлендж: 10-30 баллов</li>
              <li>⭐⭐ Средний челлендж: 40-70 баллов</li>
              <li>⭐⭐⭐ Сложный челлендж: 80-100 баллов</li>
              <li>💡 Подсказка: -10 баллов</li>
              <li>✅ Решение: -50 баллов</li>
            </ul>
          </div>
        </div>

        <div className="ranking-legend">
          <h3>🏅 Легенда рангов</h3>
          <div className="legend-items">
            <div className="legend-item gold">
              <span className="rank-icon">🥇</span>
              <span className="rank-name">1 место</span>
              <span className="rank-desc">Золотая медаль</span>
            </div>
            <div className="legend-item silver">
              <span className="rank-icon">🥈</span>
              <span className="rank-name">2 место</span>
              <span className="rank-desc">Серебряная медаль</span>
            </div>
            <div className="legend-item bronze">
              <span className="rank-icon">🥉</span>
              <span className="rank-name">3 место</span>
              <span className="rank-desc">Бронзовая медаль</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScoreBoardPage

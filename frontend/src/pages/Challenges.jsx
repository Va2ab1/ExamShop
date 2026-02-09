import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/api'
import ChallengeTracker from '../components/ChallengeTracker'
import './Challenges.css'

const Challenges = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState([])
  const [userSolves, setUserSolves] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [flag, setFlag] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadChallenges()
  }, [user, navigate])

  const loadChallenges = async () => {
    setLoading(true)
    try {
      const [challengesData, statsData] = await Promise.all([
        api.getChallenges(),
        api.getStats()
      ])
      setChallenges(challengesData.challenges || [])
      setUserSolves(challengesData.userSolves || [])
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load challenges:', error)
      setMessage('Ошибка загрузки челленджей')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFlag = async (e) => {
    e.preventDefault()
    if (!selectedChallenge || !flag.trim()) {
      setMessage('Выберите челлендж и введите флаг')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const result = await api.submitFlag(selectedChallenge.id, flag)
      if (result.correct) {
        setMessage(`🎉 Правильно! +${result.points} баллов`)
        setFlag('')
        setSelectedChallenge(null)
        loadChallenges()
      } else {
        setMessage('❌ Неверный флаг. Попробуйте снова.')
      }
    } catch (error) {
      setMessage(error.message || 'Ошибка отправки флага')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewHint = async (challengeId) => {
    try {
      const result = await api.viewHint(challengeId)
      alert(`💡 Подсказка:\n\n${result.hint}\n\nШтраф: -${result.penalty} баллов`)
      loadChallenges()
    } catch (error) {
      setMessage(error.message || 'Ошибка получения подсказки')
    }
  }

  const handleViewSolution = async (challengeId) => {
    try {
      const result = await api.viewSolution(challengeId)
      alert(`✅ Решение:\n\n${result.solution}\n\nШтраф: -${result.penalty} баллов`)
      loadChallenges()
    } catch (error) {
      setMessage(error.message || 'Ошибка получения решения')
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return <div className="loading">Загрузка челленджей...</div>
  }

  return (
    <div className="challenges-page">
      <div className="container">
        <div className="challenges-header">
          <h1>🎯 Челленджи по безопасности</h1>
          <p className="challenges-subtitle">
            33 уязвимости для изучения. Найдите флаги и зарабатывайте баллы!
          </p>
        </div>

        {message && (
          <div className={`alert ${message.includes('🎉') || message.includes('✓') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {stats && (
          <div className="progress-overview">
            <div className="progress-card">
              <div className="progress-icon">🏆</div>
              <div className="progress-info">
                <div className="progress-value">{stats.score || 0}</div>
                <div className="progress-label">Всего баллов</div>
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-icon">✅</div>
              <div className="progress-info">
                <div className="progress-value">{stats.solvedChallenges || 0} / 33</div>
                <div className="progress-label">Решено челленджей</div>
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-icon">📊</div>
              <div className="progress-info">
                <div className="progress-value">
                  {Math.round(((stats.solvedChallenges || 0) / 33) * 100)}%
                </div>
                <div className="progress-label">Прогресс</div>
              </div>
            </div>
          </div>
        )}

        <div className="submit-flag-section">
          <h2>Отправить флаг</h2>
          <form onSubmit={handleSubmitFlag} className="flag-form">
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Выберите челлендж:</label>
                <select
                  value={selectedChallenge?.id || ''}
                  onChange={(e) => {
                    const challenge = challenges.find(c => c.id === parseInt(e.target.value))
                    setSelectedChallenge(challenge)
                  }}
                  required
                >
                  <option value="">-- Выберите челлендж --</option>
                  {challenges.map(challenge => {
                    const isSolved = userSolves.some(s => s.challengeId === challenge.id)
                    return (
                      <option key={challenge.id} value={challenge.id}>
                        {challenge.name} ({challenge.points} баллов) {isSolved ? '✓' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Флаг:</label>
                <input
                  type="text"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder="FLAG{...}"
                  required
                />
              </div>

              <button type="submit" disabled={submitting} className="primary submit-flag-btn">
                {submitting ? 'Проверка...' : 'Отправить'}
              </button>
            </div>
          </form>

          {selectedChallenge && (
            <div className="challenge-details">
              <h3>{selectedChallenge.name}</h3>
              <p className="challenge-desc">{selectedChallenge.description}</p>
              <div className="challenge-meta">
                <span className="difficulty">
                  Сложность: {'⭐'.repeat(selectedChallenge.difficulty)}
                </span>
                <span className="category">
                  Категория: {selectedChallenge.category}
                </span>
                <span className="points">
                  Баллы: {selectedChallenge.points}
                </span>
              </div>
              <div className="challenge-actions">
                <button onClick={() => handleViewHint(selectedChallenge.id)}>
                  💡 Подсказка (-10 баллов)
                </button>
                <button onClick={() => handleViewSolution(selectedChallenge.id)}>
                  ✅ Решение (-50 баллов)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="challenges-tracker-section">
          <h2>Все челленджи</h2>
          <ChallengeTracker challenges={challenges} userSolves={userSolves} />
        </div>

        <div className="challenges-info">
          <div className="info-box">
            <h3>ℹ️ Как работать с челленджами</h3>
            <ul>
              <li>Исследуйте приложение и ищите уязвимости</li>
              <li>Когда найдете уязвимость, вы получите флаг формата FLAG&#123;...&#125;</li>
              <li>Отправьте флаг через форму выше для получения баллов</li>
              <li>Используйте подсказки и решения при необходимости (с штрафом)</li>
              <li>Соревнуйтесь с другими в таблице лидеров!</li>
            </ul>
          </div>

          <div className="categories-info">
            <h3>📚 Категории уязвимостей</h3>
            <div className="categories-grid">
              <div className="category-badge">Injection</div>
              <div className="category-badge">Broken Authentication</div>
              <div className="category-badge">XSS</div>
              <div className="category-badge">IDOR</div>
              <div className="category-badge">CSRF</div>
              <div className="category-badge">Security Misconfiguration</div>
              <div className="category-badge">Sensitive Data Exposure</div>
              <div className="category-badge">Access Control</div>
              <div className="category-badge">Business Logic</div>
              <div className="category-badge">File Upload</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Challenges

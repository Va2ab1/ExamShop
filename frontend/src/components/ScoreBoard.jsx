import { useState, useEffect } from 'react'
import './ScoreBoard.css'

const ScoreBoard = ({ entries, limit = 10 }) => {
  const [animatedScores, setAnimatedScores] = useState({})

  useEffect(() => {
    if (!entries) return

    entries.forEach((entry, index) => {
      setTimeout(() => {
        setAnimatedScores(prev => ({
          ...prev,
          [entry.userId]: entry.score
        }))
      }, index * 100)
    })
  }, [entries])

  if (!entries || entries.length === 0) {
    return (
      <div className="scoreboard-empty">
        <p>Пока нет результатов в таблице лидеров</p>
      </div>
    )
  }

  const displayEntries = limit ? entries.slice(0, limit) : entries

  const getMedalEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return ''
    }
  }

  return (
    <div className="scoreboard">
      <div className="scoreboard-table">
        <div className="scoreboard-header">
          <div className="rank-col">Место</div>
          <div className="user-col">Пользователь</div>
          <div className="score-col">Баллы</div>
          <div className="solved-col">Решено</div>
        </div>
        
        {displayEntries.map((entry, index) => {
          const rank = index + 1
          const displayScore = animatedScores[entry.userId] || 0
          
          return (
            <div
              key={entry.userId}
              className={`scoreboard-row rank-${rank}`}
            >
              <div className="rank-col">
                <span className="rank-number">{rank}</span>
                <span className="rank-medal">{getMedalEmoji(rank)}</span>
              </div>
              
              <div className="user-col">
                <span className="username">{entry.username}</span>
              </div>
              
              <div className="score-col">
                <span className="score-number">{displayScore}</span>
                <span className="score-label">баллов</span>
              </div>
              
              <div className="solved-col">
                <span className="solved-number">{entry.solvedChallenges || 0}</span>
                <span className="solved-label">/ 33</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ScoreBoard

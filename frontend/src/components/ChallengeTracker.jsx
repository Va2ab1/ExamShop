import './ChallengeTracker.css'

const ChallengeTracker = ({ challenges, userSolves }) => {
  const getDifficultyStars = (difficulty) => {
    return '⭐'.repeat(difficulty)
  }

  const isSolved = (challengeId) => {
    return userSolves?.some(solve => solve.challengeId === challengeId)
  }

  const getPointsEarned = (challengeId) => {
    const solve = userSolves?.find(s => s.challengeId === challengeId)
    return solve?.pointsEarned || 0
  }

  if (!challenges || challenges.length === 0) {
    return <div className="no-challenges">Челленджи не найдены</div>
  }

  const categories = [...new Set(challenges.map(c => c.category))]

  return (
    <div className="challenge-tracker">
      {categories.map(category => {
        const categoryChallenges = challenges.filter(c => c.category === category)
        const solvedCount = categoryChallenges.filter(c => isSolved(c.id)).length
        const totalCount = categoryChallenges.length
        const progress = (solvedCount / totalCount) * 100

        return (
          <div key={category} className="category-section">
            <div className="category-header">
              <h3>{category}</h3>
              <span className="category-progress">
                {solvedCount} / {totalCount} решено
              </span>
            </div>
            
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            
            <div className="challenges-list">
              {categoryChallenges.map(challenge => (
                <div
                  key={challenge.id}
                  className={`challenge-item ${isSolved(challenge.id) ? 'solved' : ''}`}
                >
                  <div className="challenge-info">
                    <div className="challenge-name">
                      {challenge.name}
                      <span className="challenge-difficulty">
                        {getDifficultyStars(challenge.difficulty)}
                      </span>
                    </div>
                    <div className="challenge-description">
                      {challenge.description}
                    </div>
                  </div>
                  
                  <div className="challenge-status">
                    {isSolved(challenge.id) ? (
                      <div className="status-solved">
                        <span className="status-badge success">✓ Решено</span>
                        <span className="points-earned">
                          +{getPointsEarned(challenge.id)} баллов
                        </span>
                      </div>
                    ) : (
                      <div className="status-unsolved">
                        <span className="status-badge warning">Не решено</span>
                        <span className="points-available">
                          {challenge.points} баллов
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ChallengeTracker

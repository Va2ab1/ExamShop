import { useState } from 'react'
import * as api from '../api/api'
import './ReviewForm.css'

const ReviewForm = ({ productId, onReviewAdded }) => {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await api.createReview(productId, rating, comment)
      setSuccess('Отзыв успешно добавлен!')
      setComment('')
      setRating(5)
      if (onReviewAdded) {
        onReviewAdded()
      }
    } catch (err) {
      setError(err.message || 'Ошибка при добавлении отзыва')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="review-form-container">
      <h3>Оставить отзыв</h3>
      
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="review-form">
        <div className="form-group">
          <label>Оценка:</label>
          <div className="rating-select">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`rating-btn ${rating >= value ? 'active' : ''}`}
                onClick={() => setRating(value)}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>Комментарий:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Напишите ваш отзыв..."
            rows="4"
            required
          />
          <div className="review-hint">
            💡 Подсказка: Попробуйте HTML-теги в комментарии (Challenge #18)
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="primary">
          {loading ? 'Отправка...' : 'Отправить отзыв'}
        </button>
      </form>
    </div>
  )
}

export default ReviewForm

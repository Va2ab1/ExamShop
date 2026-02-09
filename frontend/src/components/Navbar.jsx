import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">&gt;_</span> ExamShop
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Главная</Link>
          <Link to="/products" className="navbar-link">Товары</Link>
          <Link to="/challenges" className="navbar-link">Челленджи</Link>
          <Link to="/scoreboard" className="navbar-link">Таблица лидеров</Link>
          
          {user ? (
            <>
              <Link to="/profile" className="navbar-link">Профиль</Link>
              <Link to="/cart" className="navbar-link">
                Корзина 🛒
              </Link>
              {isAdmin() && (
                <Link to="/admin" className="navbar-link navbar-link-admin">
                  Админ-панель
                </Link>
              )}
              <button onClick={logout} className="navbar-btn">
                Выход
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-btn-link">
                <button className="navbar-btn primary">Войти</button>
              </Link>
              <Link to="/register" className="navbar-btn-link">
                <button className="navbar-btn">Регистрация</button>
              </Link>
            </>
          )}
        </div>
        
        {user && (
          <div className="navbar-user-info">
            <span className="user-name">{user.username}</span>
            <span className="user-score">⭐ {user.score || 0} баллов</span>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

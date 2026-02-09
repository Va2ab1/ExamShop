import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-warning">
          <h3>⚠️ ОБРАЗОВАТЕЛЬНЫЙ ПРОЕКТ</h3>
          <p>
            Это намеренно уязвимое приложение, созданное исключительно для обучения веб-безопасности.
            Содержит реальные уязвимости: SQL-инъекции, XSS, CSRF, IDOR и другие.
          </p>
          <p className="footer-danger">
            НЕ ИСПОЛЬЗУЙТЕ код из этого проекта в реальных приложениях!
          </p>
        </div>
        
        <div className="footer-info">
          <div className="footer-section">
            <h4>О проекте</h4>
            <p>ExamShop - платформа для изучения уязвимостей веб-приложений на практике</p>
            <p>33 челленджа по категориям OWASP Top 10</p>
          </div>
          
          <div className="footer-section">
            <h4>Технологии</h4>
            <p>Frontend: React 18 + Vite</p>
            <p>Backend: Node.js + Express</p>
            <p>База данных: SQLite</p>
          </div>
          
          <div className="footer-section">
            <h4>Категории уязвимостей</h4>
            <p>Injection, Broken Auth, XSS, IDOR, CSRF</p>
            <p>Security Misconfiguration, Sensitive Data</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 ExamShop. Все права защищены. Только для образовательных целей.</p>
          <p className="footer-github">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              GitHub Repository
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

# ExamShop Frontend

## Описание

Полнофункциональный React + Vite фронтенд для образовательного проекта ExamShop - намеренно уязвимого веб-приложения для изучения безопасности.

## Технологии

- **React 18** - UI библиотека
- **Vite 5** - Сборщик и dev сервер
- **React Router 6** - Маршрутизация
- **Vanilla CSS** - Стилизация с темной хакерской темой

## Дизайн

### Цветовая схема (Dark Hacker Theme)
- Фон: `#0d1117` (GitHub dark)
- Текст: `#c9d1d9` (светло-серый)
- Акцент зелёный: `#00ff41` (Matrix green)
- Акцент оранжевый: `#ff6600` (предупреждения)
- Акцент красный: `#ff4444` (ошибки)
- Акцент синий: `#58a6ff` (информация)

### Шрифты
- Моноширинные: Courier New, Consolas, Monaco

## Структура проекта

```
frontend/
├── index.html              # Главный HTML файл
├── package.json            # Зависимости проекта
├── vite.config.js          # Конфигурация Vite
└── src/
    ├── main.jsx            # Точка входа React
    ├── App.jsx             # Главный компонент с роутингом
    ├── index.css           # Глобальные стили
    ├── App.css             # Стили приложения
    ├── api/
    │   └── api.js          # API клиент
    ├── context/
    │   └── AuthContext.jsx # Контекст аутентификации
    ├── components/
    │   ├── Navbar.jsx              # Навигационная панель
    │   ├── Footer.jsx              # Подвал
    │   ├── ProductCard.jsx         # Карточка товара
    │   ├── ReviewForm.jsx          # Форма отзыва (XSS)
    │   ├── ChallengeTracker.jsx    # Трекер челленджей
    │   └── ScoreBoard.jsx          # Таблица лидеров
    └── pages/
        ├── Home.jsx                # Главная страница
        ├── Login.jsx               # Страница входа (SQL injection)
        ├── Register.jsx            # Регистрация
        ├── Products.jsx            # Каталог товаров (Reflected XSS)
        ├── ProductDetail.jsx       # Детали товара (Stored XSS)
        ├── Cart.jsx                # Корзина (Price manipulation)
        ├── Profile.jsx             # Профиль (IDOR)
        ├── Admin.jsx               # Админ-панель (Broken Access)
        ├── Challenges.jsx          # Страница челленджей
        └── ScoreBoardPage.jsx      # Полная таблица лидеров
```

## Страницы

### Публичные страницы
1. **Главная (/)** - Приветствие, статистика, популярные товары
2. **Вход (/login)** - Аутентификация с SQL injection подсказками
3. **Регистрация (/register)** - Создание аккаунта

### Защищённые страницы
4. **Товары (/products)** - Каталог с поиском (Reflected XSS)
5. **Детали товара (/products/:id)** - Отзывы с Stored XSS
6. **Корзина (/cart)** - Управление заказом, манипуляция ценой
7. **Профиль (/profile)** - Данные пользователя (IDOR через ?userId=)
8. **Админ-панель (/admin)** - Управление (Broken Access Control)
9. **Челленджи (/challenges)** - 33 челленджа по безопасности
10. **Таблица лидеров (/scoreboard)** - Рейтинг игроков

## API интеграция

### Аутентификация
- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/reset-password` - Сброс пароля

### Товары
- `GET /api/products` - Список товаров
- `GET /api/products/:id` - Детали товара
- `GET /api/products?search=...` - Поиск

### Пользователи
- `GET /api/users/profile` - Профиль текущего пользователя
- `PUT /api/users/profile` - Обновление профиля
- `GET /api/users/:id` - Профиль по ID (IDOR)

### Администрирование
- `GET /api/admin/dashboard` - Статистика
- `GET /api/admin/users` - Список пользователей
- `PUT /api/admin/users/:id/role` - Изменение роли

### Заказы
- `POST /api/orders` - Создание заказа
- `GET /api/orders` - Мои заказы
- `GET /api/orders/:id` - Детали заказа
- `POST /api/orders/:id/coupon` - Применить промокод

### Отзывы
- `POST /api/reviews` - Создать отзыв
- `GET /api/reviews/product/:id` - Отзывы товара

### Челленджи
- `GET /api/scoring/challenges` - Список челленджей
- `POST /api/scoring/submit` - Отправить флаг
- `GET /api/scoring/leaderboard` - Таблица лидеров
- `GET /api/scoring/stats` - Статистика пользователя
- `POST /api/scoring/challenges/:id/hint` - Подсказка
- `POST /api/scoring/challenges/:id/solution` - Решение

## Уязвимости для тестирования

### Challenge #1: SQL Injection (Login)
```
Username: admin' OR '1'='1
Password: anything
```

### Challenge #17: Reflected XSS (Search)
```
/products?search=<script>alert('XSS')</script>
```

### Challenge #18: Stored XSS (Reviews)
```
Comment: <img src=x onerror="alert('XSS')">
```

### Challenge #12: IDOR (Profile)
```
/profile?userId=1
/profile?userId=2
```

### Challenge #22: Price Manipulation (Cart)
Изменить цену товара прямо в корзине через input поле

### Challenge #13: Broken Access Control (Admin)
Доступ к админ-панели без прав администратора

### Challenge #27: Weak Password Policy
Разрешены слабые пароли типа "123"

## Команды для разработки

```bash
# Установка зависимостей
npm install

# Запуск dev сервера (http://localhost:5173)
npm run dev

# Сборка для продакшена
npm run build

# Предпросмотр собранной версии
npm run preview
```

## Особенности

### Тёмная хакерская тема
- Матричный зелёный цвет (#00ff41)
- Анимации glitch и glow эффектов
- Моноширинные шрифты
- Терминальный стиль

### Полная русификация
Весь UI на русском языке:
- Войти, Регистрация, Товары, Корзина
- Профиль, Челленджи, Таблица лидеров
- Баллы, Решено, Купить, Выход

### Адаптивный дизайн
- Mobile-first подход
- Responsive grid layouts
- Гибкие медиа-запросы

### Без внешних UI библиотек
- Чистый CSS без Bootstrap/Material-UI
- CSS переменные для темизации
- Кастомные компоненты

## Продукты (10 товаров на русском)

1. Ответы на экзамен по Математическому Анализу - 500₽
2. Шпаргалка по Дискретной Математике - 350₽
3. Ответы на ОС (Операционные системы) - 700₽
4. Решения задач по Программированию на C++ - 600₽
5. Ответы на Теорию Вероятностей - 450₽
6. Шпаргалка по Компьютерным Сетям - 400₽
7. Ответы на Базы Данных (SQL) - 550₽
8. Решения по Алгоритмам и Структурам Данных - 800₽
9. Шпаргалка по Информационной Безопасности - 999₽
10. СЕКРЕТНЫЙ ПАКЕТ: Все ответы - 9999₽

## 33 Челленджа по категориям OWASP

### Injection (3)
1. SQL Injection в форме входа
2. NoSQL Injection
3. Command Injection

### Broken Authentication (4)
4. Brute Force
5. Session Fixation
6. JWT Token Manipulation
7. Weak Password Policy

### XSS (3)
8. Reflected XSS (поиск)
9. Stored XSS (отзывы)
10. DOM-based XSS

### IDOR (3)
11. IDOR в профиле пользователя
12. IDOR в заказах
13. IDOR в файлах

### CSRF (2)
14. CSRF в изменении профиля
15. CSRF в удалении данных

### Security Misconfiguration (5)
16. Broken Access Control (админ-панель)
17. Verbose Error Messages
18. Directory Listing
19. Debug Endpoints
20. CORS Misconfiguration

### Sensitive Data Exposure (4)
21. Hardcoded Secrets
22. API Keys in Frontend
23. Sensitive Data in Logs
24. Weak Encryption

### Business Logic (6)
25. Price Manipulation
26. Coupon Abuse
27. Race Condition
28. Mass Assignment
29. Integer Overflow
30. Negative Quantity

### File Upload (2)
31. Unrestricted File Upload
32. Path Traversal

### Other (1)
33. XXE (XML External Entity)

## Безопасность

⚠️ **ВАЖНО**: Это образовательный проект с намеренными уязвимостями!

- НЕ используйте в продакшене
- НЕ размещайте в открытом интернете
- Используйте ТОЛЬКО для обучения
- Изучайте уязвимости в безопасной среде

## Лицензия

Образовательный проект. Только для обучения безопасности.

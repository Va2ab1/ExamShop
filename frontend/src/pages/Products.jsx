import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as api from '../api/api'
import ProductCard from '../components/ProductCard'
import './Products.css'

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  useEffect(() => {
    loadProducts()
  }, [searchParams])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const search = searchParams.get('search') || ''
      const data = await api.getProducts(search)
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm) {
      setSearchParams({ search: searchTerm })
    } else {
      setSearchParams({})
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchParams({})
  }

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <h1>Каталог товаров</h1>
          <p className="products-subtitle">
            Ответы на экзамены и шпаргалки для студентов
          </p>
        </div>

        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск товаров..."
              className="search-input"
            />
            <button type="submit" className="primary search-btn">
              Искать
            </button>
            {searchParams.get('search') && (
              <button type="button" onClick={clearSearch} className="clear-btn">
                Очистить
              </button>
            )}
          </form>
          
          <div className="search-hint">
            💡 Challenge #17: Попробуйте XSS в поиске, например: 
            <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code>
          </div>

          {searchParams.get('search') && (
            <div className="search-results-info">
              <p>
                Результаты поиска для: 
                <span 
                  className="search-term"
                  dangerouslySetInnerHTML={{ __html: searchParams.get('search') }}
                />
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading">Загрузка товаров...</div>
        ) : products.length > 0 ? (
          <>
            <div className="products-count">
              Найдено товаров: {products.length}
            </div>
            <div className="grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="no-products">
            <h3>Товары не найдены</h3>
            <p>Попробуйте изменить запрос поиска</p>
            <button onClick={clearSearch} className="primary">
              Показать все товары
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products

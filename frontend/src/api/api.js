const API_BASE = '/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(error.message || 'Ошибка сервера')
  }
  return response.json()
}

export const login = async (username, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  return handleResponse(response)
}

export const register = async (username, email, password) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  })
  return handleResponse(response)
}

export const resetPassword = async (email) => {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  return handleResponse(response)
}

export const getProducts = async (search = '') => {
  const url = search ? `${API_BASE}/products?search=${encodeURIComponent(search)}` : `${API_BASE}/products`
  const response = await fetch(url)
  return handleResponse(response)
}

export const getProductById = async (id) => {
  const response = await fetch(`${API_BASE}/products/${id}`)
  return handleResponse(response)
}

export const getProfile = async () => {
  const response = await fetch(`${API_BASE}/users/profile`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const updateProfile = async (data) => {
  const response = await fetch(`${API_BASE}/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  })
  return handleResponse(response)
}

export const getUserById = async (id) => {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const getAdminDashboard = async () => {
  const response = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const getUsers = async () => {
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const updateUserRole = async (userId, role) => {
  const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ role })
  })
  return handleResponse(response)
}

export const createOrder = async (items, couponCode = null) => {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ items, couponCode })
  })
  return handleResponse(response)
}

export const getOrderById = async (id) => {
  const response = await fetch(`${API_BASE}/orders/${id}`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const getAllOrders = async () => {
  const response = await fetch(`${API_BASE}/orders`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const applyCoupon = async (orderId, couponCode) => {
  const response = await fetch(`${API_BASE}/orders/${orderId}/coupon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ couponCode })
  })
  return handleResponse(response)
}

export const createReview = async (productId, rating, comment) => {
  const response = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ productId, rating, comment })
  })
  return handleResponse(response)
}

export const getReviewsByProduct = async (productId) => {
  const response = await fetch(`${API_BASE}/reviews/product/${productId}`)
  return handleResponse(response)
}

export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  })
  return handleResponse(response)
}

export const downloadFile = async (filename) => {
  const response = await fetch(`${API_BASE}/files/download?file=${encodeURIComponent(filename)}`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error('Ошибка загрузки файла')
  }
  return response.blob()
}

export const listFiles = async () => {
  const response = await fetch(`${API_BASE}/files/list`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const convertFile = async (filename, format) => {
  const response = await fetch(`${API_BASE}/files/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ filename, format })
  })
  return handleResponse(response)
}

export const createSupportTicket = async (subject, message) => {
  const response = await fetch(`${API_BASE}/support/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ subject, message })
  })
  return handleResponse(response)
}

export const getSupportTickets = async () => {
  const response = await fetch(`${API_BASE}/support/tickets`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const submitFlag = async (challengeId, flag) => {
  const response = await fetch(`${API_BASE}/scoring/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ challengeId, flag })
  })
  return handleResponse(response)
}

export const getChallenges = async () => {
  const response = await fetch(`${API_BASE}/scoring/challenges`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const getLeaderboard = async () => {
  const response = await fetch(`${API_BASE}/scoring/leaderboard`)
  return handleResponse(response)
}

export const getStats = async () => {
  const response = await fetch(`${API_BASE}/scoring/stats`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const viewHint = async (challengeId) => {
  const response = await fetch(`${API_BASE}/scoring/challenges/${challengeId}/hint`, {
    method: 'POST',
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const viewSolution = async (challengeId) => {
  const response = await fetch(`${API_BASE}/scoring/challenges/${challengeId}/solution`, {
    method: 'POST',
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const rateChallenge = async (challengeId, rating, feedback) => {
  const response = await fetch(`${API_BASE}/scoring/challenges/${challengeId}/rate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ rating, feedback })
  })
  return handleResponse(response)
}

export const getDebugInfo = async () => {
  const response = await fetch(`${API_BASE}/debug/info`)
  return handleResponse(response)
}

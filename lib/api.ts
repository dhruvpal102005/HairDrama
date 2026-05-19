import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
export const setAuthToken = (token: string, userId: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  api.defaults.headers.common['X-User-Id'] = userId
}

// Remove auth token
export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization']
  delete api.defaults.headers.common['X-User-Id']
}

export default api

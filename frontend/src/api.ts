import axios from 'axios'

export const apiClient = axios.create({
  baseURL: "/api"
})

// 响应拦截器：处理401错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除token并跳转到登录页
      localStorage.removeItem('token')
      // 如果不在登录页，则跳转
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
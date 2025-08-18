import axios from 'axios'
import { toast } from 'react-toastify'
import { interceptorLoadingElements } from './formatters'

// Khởi tạo đối tượng Axios để custom
let authorizedAxiosInstance = axios.create()

// Thời gian chời tối đa của request: 10 phút
authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10

// withCredentials: cho phép axios tự động gửi cookie trong mỗi request lên BE
authorizedAxiosInstance.defaults.withCredentials = true

/** Cấu hình Intercepters */
// Interceptor Request
authorizedAxiosInstance.interceptors.request.use((config) => {
  // Chặn spam click
  interceptorLoadingElements(true)

  return config
}, (error) => {
  // Do something with request error
  return Promise.reject(error)
})

// Interceptor Response
authorizedAxiosInstance.interceptors.response.use((response) => {
  // Chặn spam click
  interceptorLoadingElements(false)

  return response
}, (error) => {
  // Any status codes that falls outside the range of 2xx cause this function to trigger

  // Chặn spam click
  interceptorLoadingElements(false)

  let errorMessage = error?.message
  if (error.response?.data?.message) {
    errorMessage = error.response?.data?.message
  }

  if (error.response?.status !== 410) {
    toast.error(errorMessage)
  }

  return Promise.reject(error)
})

export default authorizedAxiosInstance
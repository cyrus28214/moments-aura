import { apiClient } from '@/api'

export const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/photos/upload', formData)
  return response.data
}
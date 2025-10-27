import { apiClient } from '@/api'

export const uploadFile = async (file: File) => {
  console.log('uploadFile', file.name)
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/photos/upload', formData)
  return response.data
}
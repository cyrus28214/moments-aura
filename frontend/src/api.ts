import axios from 'axios'

export const apiClient = axios.create({
  baseURL: "/api"
})

export interface User {
  id: number
  name: string
  email: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface RegisterResult {
  user: User
  token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResult {
  user: User
  token: string
}

export interface Image {
  id: number
  file_name: string
  file_size: number
}

export interface ListImagesResult {
  images: Image[]
}

export interface UploadImagesResult {
  uploaded_count: number
}

export interface DeleteImagesPayload {
  image_ids: number[]
}

export interface DeleteImagesResult {
  deleted_image_ids: number[]
}

export const register = async (payload: RegisterPayload): Promise<RegisterResult> => {
  const response = await apiClient.post('/auth/register', payload)
  return response.data
}

export const login = async (payload: LoginPayload): Promise<LoginResult> => {
  const response = await apiClient.post('/auth/login', payload)
  return response.data
}

export const get_own_profile = async (token: string): Promise<{ user: User }> => {
  const response = await apiClient.get('/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.data
}

export const upload_image = async (file: File, token: string): Promise<UploadImagesResult> => {
  const response = await apiClient.post('/images/upload', { file }, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    }
  })
  return response.data
}

export const list_images = async (token: string): Promise<ListImagesResult> => {
  const response = await apiClient.get('/images/list', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.data
}

export const get_image_content = async (image_id: number, token: string): Promise<string> => {
  const response = await apiClient.get(`/images/${image_id}/content`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    responseType: 'blob'
  })
  return URL.createObjectURL(response.data)
}

export const delete_images = async (image_ids: number[], token: string): Promise<DeleteImagesResult> => {
  const response = await apiClient.post('/images/delete-batch', { image_ids }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.data
}
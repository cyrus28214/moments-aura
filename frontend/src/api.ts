import axios from 'axios'

export const apiClient = axios.create({
  baseURL: "/api"
})

export interface User {
  id: string
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
  id: string
  image_hash: string
  width: number
  height: number
  uploaded_at: number
  tags: string[]
}

export interface ListImagesResult {
  photos: Image[]
}

export interface UploadImagesResult {
  uploaded_count: number
}

export interface DeleteImagesPayload {
  image_ids: string[]
}

export interface DeleteImagesResult {
  deleted_image_ids: string[]
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
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/photos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    }
  })
  return response.data
}

export const list_images = async (token: string, tags?: string, untagged?: boolean): Promise<ListImagesResult> => {
  const params: any = {};
  if (tags) params.tags = tags;
  if (untagged) params.untagged = untagged;

  const response = await apiClient.get('/photos/list', {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    params
  })
  return response.data
}

export const get_image_content = async (image_id: string, token: string): Promise<string> => {
  const response = await apiClient.get(`/photos/${image_id}/content`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    responseType: 'blob'
  })
  return URL.createObjectURL(response.data)
}

export const delete_images = async (image_ids: string[], token: string): Promise<DeleteImagesResult> => {
  const response = await apiClient.post('/photos/delete-batch', { image_ids }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.data
}

export interface TagBatchPayload {
  tag_names: string[]
  photo_ids: string[]
}

export interface TagBatchResult {
  success: boolean
}

export const add_tags_batch = async (payload: TagBatchPayload, token: string): Promise<TagBatchResult> => {
  const response = await apiClient.post('/tags/add-batch', payload, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.data
}

export const delete_tags_batch = async (payload: TagBatchPayload, token: string): Promise<TagBatchResult> => {
  const response = await apiClient.post('/tags/delete-batch', payload, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.data
}
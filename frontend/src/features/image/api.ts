import { apiClient } from '@/api'

export interface Image {
    id: string
    file_name: string
    file_size: number
}

export const getImages = async (): Promise<Image[]> => {
    const response = await apiClient.get('/images/list')
    return response.data.images
}

export const deleteImages = async (imageIds: string[]): Promise<string[]> => {
    const response = await apiClient.post('/images/delete-batch', { image_ids: imageIds.map(id => parseInt(id)) })
    return response.data.deleted_image_ids
}
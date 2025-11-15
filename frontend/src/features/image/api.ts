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
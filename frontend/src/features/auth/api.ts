import { apiClient } from '@/api'

export interface AuthRegisterPayload {
    name: string
    email: string
    password: string
}

export interface AuthRegisterResult {
    user: {
        id: string
        name: string
        email: string
    }
}

export const authRegister = async (payload: AuthRegisterPayload): Promise<AuthRegisterResult> => {
    const response = await apiClient.post('/auth/register', payload)
    return response.data
}
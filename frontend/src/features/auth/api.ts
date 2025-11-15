import { apiClient } from '@/api'

export interface AuthRegisterPayload {
    name: string
    email: string
    password: string
}

export interface AuthRegisterResult {
    user: {
        id: number
        name: string
        email: string
    }
}

export interface AuthLoginPayload {
    email: string
    password: string
}

export interface AuthLoginResult {
    user: {
        id: number
        name: string
        email: string
    }
}

export const authRegister = async (payload: AuthRegisterPayload): Promise<AuthRegisterResult> => {
    const response = await apiClient.post('/auth/register', payload)
    return response.data
}

export const authLogin = async (payload: AuthLoginPayload): Promise<AuthLoginResult> => {
    const response = await apiClient.post('/auth/login', payload)
    return response.data
}

export interface AuthMeResult {
    user: {
        id: number
        name: string
        email: string
    }
}

export const authMe = async (): Promise<AuthMeResult> => {
    const response = await apiClient.get('/auth/me')
    return response.data
}
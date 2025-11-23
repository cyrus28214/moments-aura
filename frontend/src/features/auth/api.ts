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
    token: string
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
token: string
}

export const authRegister = async (payload: AuthRegisterPayload): Promise<AuthRegisterResult> => {
    const response = await apiClient.post('/auth/register', payload)
    const data = response.data
    // 保存token到localStorage
    if (data.token) {
        localStorage.setItem('token', data.token)
    }
    return data
}

export const authLogin = async (payload: AuthLoginPayload): Promise<AuthLoginResult> => {
    const response = await apiClient.post('/auth/login', payload)
    const data = response.data
    // 保存token到localStorage
    if (data.token) {
        localStorage.setItem('token', data.token)
    }
    return data
}

export interface AuthMeResult {
    user: {
        id: number
        name: string
        email: string
    }
}

export const authMe = async (token: string): Promise<AuthMeResult> => {
    const response = await apiClient.get('/auth/me', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data
}
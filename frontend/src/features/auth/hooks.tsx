import { createContext, useState } from "react"
import { useLocalStorage } from "@/lib/use-local-storage"
import { authLogin, authMe, authRegister, type AuthMeResult } from "./api"
import { useEffect } from "react"

type User = AuthMeResult["user"]
  
type AuthContextType = {
    user: User | null,
    token: string | null,
    isLoading: boolean,
    refreshUser: () => Promise<void>,
    logout: () => void,
    login: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null);

export const authProvider = ({ children }: { children: React.ReactNode }) => {
    const [status, setStatus] = useState<AuthContextType["status"]>("loading")
    const [token, setToken] = useLocalStorage<string | null>("token", null)
    const [user, setUser] = useState<User | null>(null)
    const initAuth = async () => {
        if (!token) {
            setStatus("unauthenticated")
            return
        }
        try {
            const { user } = await authMe(token)
            setUser(user)
            setStatus("authenticated")
        } catch (error) {
            console.error(error)
            setUser(null)
            setToken(null)
            setStatus("unauthenticated")
        }
    }

    const refreshUser = async () => {
        try {
            const { user } = await authMe(token!)
            setUser(user)
        } catch (error) {
            console.error(error)
            setUser(null)
        }
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        setStatus("unauthenticated")
    }

    const login = async (email: string, password: string) => {
        setStatus("loading")
        try {
            const { token } = await authLogin({ email, password })
            setToken(token)
            await refreshUser()
            setStatus("authenticated")
        } catch (error) {
            console.error(error)
            setStatus("unauthenticated")
        }
    }

    const register = async (name: string, email: string, password: string) => {
        setStatus("loading")
        try {
            const { token } = await authRegister({ name, email, password })
            setToken(token)
            await refreshUser()
            setStatus("authenticated")
        } catch (error) {
            console.error(error)
            setStatus("unauthenticated")
        }
    }

    let context: AuthContextType;

    if (status === "loading") {
        context = {
            status: "loading",
        }
    } else if (status === "authenticated") {
    }

    useEffect(() => {
        initAuth()
    }, [token])
}           
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getUserId } from "./user"

interface User {
  id: number
  email: string
  nickname?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  deviceId: string
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, nickname?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deviceId, setDeviceId] = useState("")

  useEffect(() => {
    setDeviceId(getUserId())
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem("sessionToken")
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      console.error("Auth check failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, deviceId }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      localStorage.setItem("sessionToken", data.sessionToken)
      setUser(data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: "登录失败，请重试" }
    }
  }

  const register = async (email: string, password: string, nickname?: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname, deviceId }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error }
      }

      localStorage.setItem("sessionToken", data.sessionToken)
      setUser(data.user)
      return { success: true }
    } catch (error) {
      return { success: false, error: "注册失败，请重试" }
    }
  }

  const logout = async () => {
    const token = localStorage.getItem("sessionToken")
    if (token) {
      await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
    }
    localStorage.removeItem("sessionToken")
    setUser(null)
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, deviceId, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

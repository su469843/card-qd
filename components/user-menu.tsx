"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { User, LogOut, Gift, Wallet, ChevronDown } from "lucide-react"

export function UserMenu() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="h-9 w-20 rounded-lg bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/redeem">
          <Button variant="ghost" size="sm" className="gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">兑换</span>
          </Button>
        </Link>
        <Link href="/login">
          <Button size="sm" className="gap-2">
            <User className="h-4 w-4" />
            登录
          </Button>
        </Link>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm">
          {user.nickname?.[0] || user.email[0].toUpperCase()}
        </div>
        <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
          {user.nickname || user.email.split("@")[0]}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-border">
              <p className="font-medium truncate">{user.nickname || "用户"}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
            
            <div className="p-2">
              <Link
                href="/wallet"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Wallet className="h-4 w-4" />
                <span>我的钱包</span>
              </Link>
              <Link
                href="/my-gifts"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Gift className="h-4 w-4" />
                <span>我的礼品卡</span>
              </Link>
              <Link
                href="/redeem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Gift className="h-4 w-4" />
                <span>兑换礼品卡</span>
              </Link>
            </div>

            <div className="p-2 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

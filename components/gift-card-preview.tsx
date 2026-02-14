"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Gift } from "lucide-react"

interface GiftCardPreviewProps {
  amount: number
  recipientEmail?: string
  isGiftForOthers?: boolean
}

export function GiftCardPreview({ amount, recipientEmail, isGiftForOthers }: GiftCardPreviewProps) {
  const [displayAmount, setDisplayAmount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // 数字跳动动画
  useEffect(() => {
    if (amount === displayAmount) return

    setIsAnimating(true)
    const duration = 800
    const steps = 30
    const increment = (amount - displayAmount) / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setDisplayAmount(amount)
        setIsAnimating(false)
        clearInterval(timer)
      } else {
        setDisplayAmount((prev) => prev + increment)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [amount])

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-8 shadow-2xl transform hover:scale-105 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-[url('/balance-card.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-2xl" />

        {/* 内容 */}
        <div className="relative z-10">
          {/* 顶部标签 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/90 text-sm font-medium">礼品卡</span>
            </div>
            <div className="text-white/70 text-xs">Gift Card</div>
          </div>

          {/* 金额显示 */}
          <div className="mb-8">
            <div className="text-white/80 text-sm mb-2">Card Value</div>
            <div className={`text-5xl font-bold text-white transition-all duration-300 ${isAnimating ? "scale-110" : "scale-100"}`}>
              ¥{displayAmount.toFixed(2)}
            </div>
          </div>

          {/* 收件人信息 */}
          {isGiftForOthers && recipientEmail && (
            <div className="mb-6 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <div className="text-white/70 text-xs mb-1">赠送给</div>
              <div className="text-white text-sm font-medium truncate">{recipientEmail}</div>
            </div>
          )}

          {/* 卡片信息 */}
          <div className="flex items-center justify-between text-white/60 text-xs">
            <div>
              <div className="mb-1">卡号</div>
              <div className="font-mono">**** **** **** ****</div>
            </div>
            <div className="text-right">
              <div className="mb-1">有效期</div>
              <div>永久有效</div>
            </div>
          </div>

          {/* 装饰线条 */}
          <div className="absolute bottom-4 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* 光效动画 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" />
      </Card>

      {/* 卡片提示 */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        {isGiftForOthers ? "对方收到后可立即兑换到账户余额" : "购买后将直接充值到您的账户"}
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function ConfirmPaymentForm() {
  const [paymentCode, setPaymentCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentCode.trim()) {
      toast({
        title: "请输入付款码",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentCode: paymentCode.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "确认失败")
      }

      toast({
        title: "确认成功",
        description: `订单 #${data.orderId} 已确认付款`,
      })

      setPaymentCode("")
      router.refresh()
    } catch (error) {
      console.error("[v0] 确认付款错误:", error)
      toast({
        title: "确认失败",
        description: error instanceof Error ? error.message : "请检查付款码是否正确",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>确认付款</CardTitle>
        <CardDescription>输入用户提供的付款码</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentCode">付款码</Label>
            <Input
              id="paymentCode"
              value={paymentCode}
              onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
              placeholder="输入8位付款码"
              maxLength={8}
              className="text-lg font-mono tracking-wider"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full" size="lg">
            {isLoading ? "确认中..." : "确认付款"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

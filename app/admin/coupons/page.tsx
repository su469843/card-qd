"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Coupon {
  id: number
  code: string
  discount_type: string
  discount_value: number
  is_active: boolean
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // 表单数据
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/coupons")
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons)
      }
    } catch (error) {
      console.error("[v0] 获取优惠码错误:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue: Number.parseFloat(discountValue),
        }),
      })

      if (response.ok) {
        setCode("")
        setDiscountValue("")
        setShowForm(false)
        fetchCoupons()
      } else {
        alert("创建优惠码失败")
      }
    } catch (error) {
      console.error("[v0] 创建优惠码错误:", error)
      alert("创建失败")
    }
  }

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchCoupons()
      }
    } catch (error) {
      console.error("[v0] 更新优惠码错误:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回管理后台
            </Button>
          </Link>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "取消" : "添加优惠码"}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">优惠码管理</h1>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>添加新优惠码</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">优惠码</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    placeholder="SAVE20"
                  />
                </div>

                <div>
                  <Label htmlFor="type">折扣类型</Label>
                  <Select value={discountType} onValueChange={(value: any) => setDiscountType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">百分比折扣</SelectItem>
                      <SelectItem value="fixed">固定金额</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="value">折扣值 {discountType === "percentage" ? "(百分比)" : "(金额)"}</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    placeholder={discountType === "percentage" ? "10" : "20"}
                  />
                </div>

                <Button type="submit" className="w-full">
                  创建优惠码
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无优惠码</p>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <Card key={coupon.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{coupon.code}</h3>
                      <p className="text-muted-foreground mt-1">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}% 折扣`
                          : `¥${coupon.discount_value} 优惠`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${coupon.id}`} className="text-sm">
                        {coupon.is_active ? "启用" : "禁用"}
                      </Label>
                      <Switch
                        id={`active-${coupon.id}`}
                        checked={coupon.is_active}
                        onCheckedChange={() => toggleActive(coupon.id, coupon.is_active)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

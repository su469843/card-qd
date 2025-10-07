"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCart, getCartTotal, clearCart } from "@/lib/cart"
import { getUserId } from "@/lib/user"
import { countries } from "@/lib/countries"
import { Turnstile } from "@marsidev/react-turnstile"

export default function CheckoutPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [cart, setCart] = useState(getCart())
  const [total, setTotal] = useState(getCartTotal())
  const [turnstileToken, setTurnstileToken] = useState("")

  // 表单数据
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [notes, setNotes] = useState("")
  const [couponCode, setCouponCode] = useState("")

  // 优惠码状态
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | null>(null)
  const [couponError, setCouponError] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)

  useEffect(() => {
    if (cart.length === 0) {
      router.push("/cart")
    }
  }, [cart, router])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("请输入优惠码")
      return
    }

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      })

      if (!response.ok) {
        const data = await response.json()
        setCouponError(data.error || "优惠码无效")
        setDiscount(0)
        setDiscountType(null)
        setCouponApplied(false)
        return
      }

      const data = await response.json()
      setDiscountType(data.discountType)
      setDiscount(data.discountValue)
      setCouponError("")
      setCouponApplied(true)
    } catch (error) {
      console.error("[v0] 验证优惠码错误:", error)
      setCouponError("验证失败，请重试")
    }
  }

  const calculateFinalPrice = () => {
    if (!discountType) return total

    if (discountType === "percentage") {
      return total * (1 - discount / 100)
    } else {
      return Math.max(0, total - discount)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] 结账页面: 开始提交订单")
    console.log("[v0] 结账页面: 表单数据 =", { email, country, addressLine1, addressLine2, notes, couponCode })

    if (!email || !country || !addressLine1) {
      alert("请填写必填项")
      return
    }

    if (!turnstileToken) {
      alert("请完成验证")
      return
    }

    setIsLoading(true)

    try {
      const userId = getUserId()
      const finalPrice = calculateFinalPrice()
      const discountAmount = total - finalPrice

      console.log("[v0] 结账页面: 准备创建订单，用户ID =", userId)
      console.log("[v0] 结账页面: 最终价格 =", finalPrice, "优惠金额 =", discountAmount)

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          userId,
          email,
          country,
          addressLine1,
          addressLine2,
          notes,
          couponCode: couponApplied ? couponCode : null,
          discountAmount,
          finalPrice,
          turnstileToken,
        }),
      })

      console.log("[v0] 结账页面: 创建订单 API 响应状态 =", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] 结账页面: 创建订单失败，错误响应 =", errorText)
        throw new Error("创建订单失败")
      }

      const { orderId, isFree } = await response.json()
      console.log("[v0] 结账页面: 订单创建成功，订单ID =", orderId, "是否免费 =", isFree)

      clearCart()

      if (isFree) {
        console.log("[v0] 结账页面: 免费订单，跳转到订单列表")
        router.push("/orders?success=true")
      } else {
        console.log("[v0] 结账页面: 付费订单，跳转到支付页面")
        router.push(`/payment/${orderId}`)
      }
    } catch (error) {
      console.error("[v0] 结账页面: 创建订单错误 =", error)
      console.error("[v0] 结账页面: 错误详情 =", error instanceof Error ? error.message : String(error))
      alert("创建订单失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const finalPrice = calculateFinalPrice()
  const discountAmount = total - finalPrice

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/cart">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回购物车
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">结账</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>配送信息</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">
                      邮箱 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">
                      国家/地区 <span className="text-destructive">*</span>
                    </Label>
                    <Select value={country} onValueChange={setCountry} required>
                      <SelectTrigger id="country">
                        <SelectValue placeholder="请选择国家/地区" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {countries.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="address1">
                      地址一 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address1"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      required
                      placeholder="街道地址"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address2">地址二</Label>
                    <Input
                      id="address2"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="公寓、单元等（可选）"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">备注</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="订单备注（可选）"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="coupon">优惠码</Label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value)
                          setCouponError("")
                        }}
                        placeholder="输入优惠码"
                        disabled={couponApplied}
                      />
                      <Button type="button" onClick={handleApplyCoupon} disabled={couponApplied} variant="outline">
                        {couponApplied ? "已应用" : "应用"}
                      </Button>
                    </div>
                    {couponError && <p className="text-sm text-destructive mt-1">{couponError}</p>}
                    {couponApplied && <p className="text-sm text-green-600 mt-1">优惠码已成功应用！</p>}
                  </div>

                  <div>
                    <Label>安全验证</Label>
                    <div className="mt-2">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAB48K0IuWR_YyY9U"}
                        onSuccess={(token) => setTurnstileToken(token)}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading || !turnstileToken} className="w-full" size="lg">
                    {isLoading ? "处理中..." : "确认支付"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>订单摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>商品数量</span>
                    <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>小计</span>
                    <span>¥{total.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>优惠</span>
                      <span>-¥{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">总计</span>
                    <span className="text-2xl font-bold text-primary">¥{finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

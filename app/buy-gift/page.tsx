"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Gift, Sparkles, Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { GiftCardPreview } from "@/components/gift-card-preview"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000]

interface PurchaseResult {
  success: boolean
  code?: string
  cardValue?: number
  giftUrl?: string
  redeemed?: boolean
  newBalance?: number
}

export default function BuyGiftCardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [amount, setAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState("")
  const [isGiftForOthers, setIsGiftForOthers] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleAmountChange = (value: number) => {
    setAmount(value)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    const num = Number.parseFloat(value)
    if (!Number.isNaN(num) && num > 0) {
      setAmount(num)
    }
  }

  const copyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({ title: "已复制到剪贴板" })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({ title: "复制失败", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setPurchaseResult(null)
    setAmount(100)
    setCustomAmount("")
    setIsGiftForOthers(false)
    setRecipientEmail("")
    setMessage("")
  }

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "购买礼品卡需要先登录账户",
        variant: "destructive",
      })
      router.push("/login?from=/buy-gift")
      return
    }

    if (amount <= 0) {
      toast({
        title: "金额无效",
        description: "请输入有效的金额",
        variant: "destructive",
      })
      return
    }

    if (isGiftForOthers && !recipientEmail) {
      toast({
        title: "请输入收件人邮箱",
        description: "赠送给他人需要填写收件人邮箱",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 创建订单 - 购买消费卡商品
      // 这里我们需要找到消费卡商品或创建一个临时订单
      const response = await fetch("/api/gift/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("sessionToken") || ""}`
        },
        body: JSON.stringify({
          cardValue: amount,
          isGift: isGiftForOthers,
          userId: user.id,
          recipientEmail: isGiftForOthers ? recipientEmail : null,
          message: message || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "创建礼品卡失败")
      }

      toast({
        title: "礼品卡创建成功",
        description: isGiftForOthers ? "已生成兑换码，可以分享给对方" : "余额已充值到账户",
      })

      // 如果是赠送模式，直接显示兑换码
      if (isGiftForOthers && data.code) {
        setPurchaseResult({
          success: true,
          code: data.code,
          cardValue: amount,
          giftUrl: data.giftUrl || `${window.location.origin}/redeem?code=${data.code}`,
        })
      } else {
        // 自用模式，跳转到钱包
        router.push("/wallet")
      }
    } catch (error) {
      console.error("[v0] 购买礼品卡错误:", error)
      toast({
        title: "购买失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 顶部导航 */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            购买礼品卡
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 购买成功：显示兑换码 */}
        {purchaseResult?.success && purchaseResult.code && (
          <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">礼品卡创建成功!</CardTitle>
                <CardDescription>请复制下方兑换码分享给您的朋友</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 金额显示 */}
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">¥{purchaseResult.cardValue}</span>
                </div>

                {/* 兑换码显示 */}
                <div className="p-4 rounded-xl bg-background border-2 border-dashed border-primary/30">
                  <p className="text-xs text-muted-foreground mb-2 text-center">兑换码</p>
                  <div className="flex items-center justify-center gap-3">
                    <code className="text-2xl font-mono font-bold tracking-wider text-foreground">
                      {purchaseResult.code}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyCode(purchaseResult.code!)}
                      className="shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* 兑换链接 */}
                {purchaseResult.giftUrl && (
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-2">或分享兑换链接</p>
                    <div className="flex items-center gap-2">
                      <Input value={purchaseResult.giftUrl} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyCode(purchaseResult.giftUrl!)}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetForm} className="flex-1">
                    继续购买
                  </Button>
                  <Link href="/my-gifts" className="flex-1">
                    <Button className="w-full">
                      查看我的礼品卡
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  兑换码永久有效，请妥善保管
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 购买表单 */}
        {!purchaseResult && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左侧：购买表单 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  选择金额
                </CardTitle>
                <CardDescription>选择预设金额或输入自定义金额</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 预设金额 */}
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AMOUNTS.map((preset) => (
                    <Button
                      key={preset}
                      variant={amount === preset && !customAmount ? "default" : "outline"}
                      onClick={() => handleAmountChange(preset)}
                      className="h-16 text-lg font-semibold"
                    >
                      ¥{preset}
                    </Button>
                  ))}
                </div>

                {/* 自定义金额 */}
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">自定义金额</Label>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="输入金额"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                </div>

                {/* 赠送选项 */}
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="gift-toggle" className="text-base font-medium">
                        赠送他人
                      </Label>
                      <p className="text-sm text-muted-foreground">生成兑换码分享给朋友</p>
                    </div>
                    <Switch id="gift-toggle" checked={isGiftForOthers} onCheckedChange={setIsGiftForOthers} />
                  </div>

                  {isGiftForOthers && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="recipient-email">收件人邮箱 *</Label>
                        <Input
                          id="recipient-email"
                          type="email"
                          placeholder="friend@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">祝福留言（可选）</Label>
                        <Input
                          id="message"
                          placeholder="写下你的祝福..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={100}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 购买按钮 */}
                <Button onClick={handlePurchase} disabled={isLoading} className="w-full h-12 text-lg" size="lg">
                  {isLoading ? "处理中..." : `购买 ¥${amount.toFixed(2)}`}
                </Button>

                {/* 说明 */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 自用：购买后余额立即充值到账户</p>
                  <p>• 赠送：生成兑换码，对方兑换后余额到账</p>
                  <p>• 兑换码永久有效，可随时使用</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：卡片预览 */}
          <div className="flex flex-col items-center justify-start pt-8">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold mb-2">卡片预览</h3>
              <p className="text-sm text-muted-foreground">实时预览你的礼品卡</p>
            </div>

            <GiftCardPreview amount={amount} recipientEmail={recipientEmail} isGiftForOthers={isGiftForOthers} />
          </div>
        </div>
        )}
      </main>
    </div>
  )
}

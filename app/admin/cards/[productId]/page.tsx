"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductCard {
  id: number
  card_code: string
  status: string
  order_id: number | null
  created_at: string
  used_at: string | null
}

export default function ProductCardsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = Number(params.productId)
  const [productName, setProductName] = useState("")
  const [cards, setCards] = useState<ProductCard[]>([])
  const [cardInput, setCardInput] = useState("")
  const [separator, setSeparator] = useState<"newline" | "comma">("newline")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [productId])

  const fetchData = async () => {
    try {
      const [productRes, cardsRes] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch(`/api/cards/${productId}`),
      ])

      if (productRes.ok) {
        const product = await productRes.json()
        setProductName(product.name)
      }

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json()
        setCards(cardsData)
      }
    } catch (error) {
      console.error("[v0] 获取数据错误:", error)
    }
  }

  const handleAddCards = async () => {
    if (!cardInput.trim()) {
      toast({
        title: "请输入卡密",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const cardCodes =
      separator === "newline"
        ? cardInput
            .split("\n")
            .map((c) => c.trim())
            .filter(Boolean)
        : cardInput
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)

    if (cardCodes.length === 0) {
      toast({
        title: "没有有效的卡密",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          cardCodes,
        }),
      })

      if (!response.ok) throw new Error("添加失败")

      const result = await response.json()

      toast({
        title: "添加成功",
        description: `成功添加 ${result.added} 个卡密`,
      })

      setCardInput("")
      fetchData()
    } catch (error) {
      console.error("[v0] 添加卡密错误:", error)
      toast({
        title: "添加失败",
        description: "请重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm("确定要删除这个卡密吗？")) return

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("删除失败")

      toast({
        title: "删除成功",
      })

      fetchData()
    } catch (error) {
      console.error("[v0] 删除卡密错误:", error)
      toast({
        title: "删除失败",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/cards">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{productName}</h1>
              <p className="text-sm text-muted-foreground">卡密管理</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>批量添加卡密</CardTitle>
            <CardDescription>支持换行或逗号分割</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>分隔符</Label>
              <Select value={separator} onValueChange={(v: "newline" | "comma") => setSeparator(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newline">换行分割</SelectItem>
                  <SelectItem value="comma">逗号分割</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>卡密内容</Label>
              <Textarea
                value={cardInput}
                onChange={(e) => setCardInput(e.target.value)}
                placeholder={
                  separator === "newline"
                    ? "每行一个卡密\nABCD-1234-EFGH\nIJKL-5678-MNOP"
                    : "逗号分割卡密\nABCD-1234-EFGH,IJKL-5678-MNOP"
                }
                rows={8}
                className="font-mono"
              />
            </div>

            <Button onClick={handleAddCards} disabled={isLoading} className="w-full">
              {isLoading ? "添加中..." : "确定添加"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>卡密列表</CardTitle>
            <CardDescription>共 {cards.length} 个卡密</CardDescription>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无卡密，请先添加</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>卡密</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>订单ID</TableHead>
                    <TableHead>添加时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono">{card.card_code}</TableCell>
                      <TableCell>
                        <Badge variant={card.status === "available" ? "default" : "secondary"}>
                          {card.status === "available" ? "可用" : "已用"}
                        </Badge>
                      </TableCell>
                      <TableCell>{card.order_id || "-"}</TableCell>
                      <TableCell>{new Date(card.created_at).toLocaleString("zh-CN")}</TableCell>
                      <TableCell className="text-right">
                        {card.status === "available" && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCard(card.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

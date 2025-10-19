"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: number
  name: string
  use_card_delivery: boolean
}

interface CardStats {
  product_id: number
  product_name: string
  total: number
  available: number
  used: number
}

export default function CardsManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<CardStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, statsRes] = await Promise.all([fetch("/api/products"), fetch("/api/cards/stats")])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.filter((p: Product) => p.use_card_delivery))
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("[v0] 获取数据错误:", error)
      toast({
        title: "加载失败",
        description: "无法加载卡密数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getProductStats = (productId: number) => {
    return stats.find((s) => s.product_id === productId) || { total: 0, available: 0, used: 0 }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">卡密管理</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>商品卡密库存</CardTitle>
            <CardDescription>管理开启卡密发货的商品卡密</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">暂无开启卡密发货的商品</p>
                <Link href="/admin/products/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    添加商品
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名称</TableHead>
                    <TableHead className="text-center">总数</TableHead>
                    <TableHead className="text-center">可用</TableHead>
                    <TableHead className="text-center">已用</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const productStats = getProductStats(product.id)
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-center">{productStats.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={productStats.available > 0 ? "default" : "destructive"}>
                            {productStats.available}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{productStats.used}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/cards/${product.id}`}>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              添加卡密
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

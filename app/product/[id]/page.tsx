import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Clock, Package, AlertCircle } from "lucide-react"
import { sql } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { BuyNowButton } from "@/components/buy-now-button"
import { CartButton } from "@/components/cart-button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
  description: string | null
  tags: string | null
  use_card_delivery: boolean
  max_per_user: number | null
  total_stock: number | null
  sold_count: number
  sale_end_time: string | null
  is_presale: boolean
  presale_start_time: string | null
}

export const dynamic = "force-dynamic"

export default async function ProductPage({ params }: { params: { id: string } }) {
  const productId = Number.parseInt(params.id)

  if (Number.isNaN(productId)) {
    notFound()
  }

  const products = await sql<Product[]>`
    SELECT 
      id, name, price, image_url, description, tags,
      use_card_delivery, max_per_user, total_stock, sold_count,
      sale_end_time, is_presale, presale_start_time
    FROM products
    WHERE id = ${productId}
  `

  if (products.length === 0) {
    notFound()
  }

  const product = products[0]

  const now = new Date()
  const saleEndTime = product.sale_end_time ? new Date(product.sale_end_time) : null
  const presaleStartTime = product.presale_start_time ? new Date(product.presale_start_time) : null

  const isSaleEnded = saleEndTime && now > saleEndTime
  const isStockOut = product.total_stock !== null && product.sold_count >= product.total_stock
  const isPresaleNotStarted = product.is_presale && presaleStartTime && now < presaleStartTime

  const canPurchase = !isSaleEnded && !isStockOut && !isPresaleNotStarted

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-foreground">
            商户购买平台
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              管理员入口
            </Link>
            <CartButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回商品列表
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            <Image
              src={product.image_url || "/placeholder.svg?height=600&width=600&query=product"}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="flex flex-col">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-4 text-foreground">{product.name}</h1>

                {product.tags && (
                  <div className="mb-4">
                    <span className="inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                      {product.tags}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-4xl font-bold text-primary">¥{Number.parseFloat(product.price).toFixed(2)}</p>
                </div>

                <div className="space-y-3 mb-6">
                  {product.use_card_delivery && (
                    <Alert>
                      <Package className="h-4 w-4" />
                      <AlertDescription>本商品使用卡密发货，购买后可在订单中查看卡密</AlertDescription>
                    </Alert>
                  )}

                  {isSaleEnded && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        销售已结束（截止时间：{saleEndTime?.toLocaleString("zh-CN")}）
                      </AlertDescription>
                    </Alert>
                  )}

                  {isStockOut && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>商品已售罄</AlertDescription>
                    </Alert>
                  )}

                  {isPresaleNotStarted && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        预售商品，开售时间：{presaleStartTime?.toLocaleString("zh-CN")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {product.total_stock !== null && !isStockOut && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>剩余库存：{product.total_stock - product.sold_count} 件</span>
                    </div>
                  )}

                  {product.max_per_user !== null && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>每人限购：{product.max_per_user} 件</span>
                    </div>
                  )}

                  {saleEndTime && !isSaleEnded && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>销售截止：{saleEndTime.toLocaleString("zh-CN")}</span>
                    </div>
                  )}
                </div>

                {product.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2 text-foreground">商品介绍</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}

                {canPurchase ? (
                  <div className="flex flex-col gap-3 mt-8">
                    <BuyNowButton product={product} />
                    <AddToCartButton product={product} />
                  </div>
                ) : (
                  <div className="mt-8">
                    <Button disabled className="w-full" size="lg">
                      暂时无法购买
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

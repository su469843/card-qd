import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { sql } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { BuyNowButton } from "@/components/buy-now-button"
import { CartButton } from "@/components/cart-button"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
  description: string | null
  tags: string | null
}

export const dynamic = "force-dynamic"

export default async function ProductPage({ params }: { params: { id: string } }) {
  const productId = Number.parseInt(params.id)

  if (Number.isNaN(productId)) {
    notFound()
  }

  const products = await sql<Product[]>`
    SELECT id, name, price, image_url, description, tags
    FROM products
    WHERE id = ${productId}
  `

  if (products.length === 0) {
    notFound()
  }

  const product = products[0]

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

                {product.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2 text-foreground">商品介绍</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-8">
                  <BuyNowButton product={product} />
                  <AddToCartButton product={product} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

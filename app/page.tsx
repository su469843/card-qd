import Link from "next/link"
import { sql } from "@/lib/db"
import { ProductCard } from "@/components/product-card"
import { CartButton } from "@/components/cart-button"
import { BalanceDisplay } from "@/components/balance-display"
import { UserMenu } from "@/components/user-menu"
import { Package, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
  description: string | null
  tags: string | null
}

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const products = await sql<Product[]>`
    SELECT id, name, price, image_url, description, tags
    FROM products
    ORDER BY created_at DESC
  `

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-foreground">
            商户购买平台
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/buy-gift">
              <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950">
                <Gift className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">礼品卡</span>
              </Button>
            </Link>
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                <Package className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">订单</span>
              </Button>
            </Link>
            <Link href="/admin" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              管理员
            </Link>
            <CartButton />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <BalanceDisplay />
        </div>

        <Link href="/buy-gift" className="block mb-8 group">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-8 text-white transition-transform hover:scale-[1.02]">
            <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">送礼首选 · 心意满满</h2>
                <p className="text-purple-100">购买礼品卡，分享给朋友和家人 →</p>
              </div>
              <Gift className="h-16 w-16 opacity-80 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </Link>
        
        <h1 className="text-3xl font-bold mb-8 text-foreground">精选商品</h1>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">暂无商品</p>
            <Link href="/admin" className="inline-block mt-4 text-primary hover:underline">
              前往管理员后台添加商品
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

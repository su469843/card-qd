import Link from "next/link"
import { Plus } from "lucide-react"
import { sql } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { ProductList } from "@/components/admin/product-list"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
  description: string | null
  tags: string | null
}

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const products = await sql<Product[]>`
    SELECT id, name, price, image_url, description, tags
    FROM products
    ORDER BY created_at DESC
  `

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">商品管理</h1>
          <div className="flex items-center gap-3">
            <Link href="/admin/products/add">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                添加商品
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="bg-transparent">
                返回后台
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ProductList products={products} />
      </main>
    </div>
  )
}

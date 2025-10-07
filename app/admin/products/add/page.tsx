import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AddProductForm } from "@/components/admin/add-product-form"

export default function AddProductPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">添加商品</h1>
          <Link href="/admin/products">
            <Button variant="outline" size="sm" className="bg-transparent">
              返回商品列表
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <AddProductForm />
        </div>
      </main>
    </div>
  )
}

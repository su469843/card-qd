import { sql } from "@/lib/db"
import { EditProductForm } from "@/components/admin/edit-product-form"
import { notFound } from "next/navigation"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
  description: string | null
  tags: string | null
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const productId = Number.parseInt(params.id)

  if (isNaN(productId)) {
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">编辑商品</h1>
        <EditProductForm product={product} />
      </div>
    </div>
  )
}

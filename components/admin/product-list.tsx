"use client"

import Image from "next/image"
import { Trash2, Pencil } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
  description: string | null
  tags: string | null
}

export function ProductList({ products }: { products: Product[] }) {
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除商品"${name}"吗？`)) return

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("删除失败")

      toast({
        title: "删除成功",
        description: `商品"${name}"已删除`,
      })

      router.refresh()
    } catch (error) {
      console.error("[v0] 删除商品错误:", error)
      toast({
        title: "删除失败",
        description: "请重试",
        variant: "destructive",
      })
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">暂无商品</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={product.image_url || "/placeholder.svg?height=100&width=100&query=product"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                <p className="text-primary font-bold mt-1">¥{Number.parseFloat(product.price).toFixed(2)}</p>
                {product.tags && <p className="text-xs text-muted-foreground mt-1">{product.tags}</p>}
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
                )}
              </div>

              <div className="flex items-start gap-2">
                <Link href={`/admin/products/edit/${product.id}`}>
                  <Button variant="ghost" size="icon" className="text-primary hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(product.id, product.name)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

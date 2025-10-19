"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { addToCart } from "@/lib/cart"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
}

export function AddToCartButton({ product }: { product: Product }) {
  const { toast } = useToast()

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: Number.parseFloat(product.price),
      imageUrl: product.image_url || undefined,
    })

    toast({
      title: "已添加到购物车",
      description: `${product.name} 已成功添加到购物车`,
    })
  }

  return (
    <Button onClick={handleAddToCart} className="w-full" size="lg">
      <ShoppingCart className="mr-2 h-4 w-4" />
      加入购物车
    </Button>
  )
}

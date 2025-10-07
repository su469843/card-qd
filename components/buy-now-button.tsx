"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { addToCart } from "@/lib/cart"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
}

export function BuyNowButton({ product }: { product: Product }) {
  const router = useRouter()

  const handleBuyNow = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: Number.parseFloat(product.price),
      imageUrl: product.image_url || undefined,
    })
    router.push("/cart")
  }

  return (
    <Button onClick={handleBuyNow} size="lg" className="w-full">
      立即购买
    </Button>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { addToCart, getCart, updateCartItemQuantity } from "@/lib/cart"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
}

export function AddToCartButton({ product }: { product: Product }) {
  const { toast } = useToast()
  const [cartQuantity, setCartQuantity] = useState(0)
  const [isInCart, setIsInCart] = useState(false)

  useEffect(() => {
    const updateCartState = () => {
      const cart = getCart()
      const cartItem = cart.find(item => item.productId === product.id)
      if (cartItem) {
        setCartQuantity(cartItem.quantity)
        setIsInCart(true)
      } else {
        setCartQuantity(0)
        setIsInCart(false)
      }
    }

    updateCartState()
    
    window.addEventListener('cartUpdated', updateCartState)
    return () => window.removeEventListener('cartUpdated', updateCartState)
  }, [product.id])

  const handleAddToCart = () => {
    if (isInCart) {
      updateCartItemQuantity(product.id, cartQuantity + 1)
      toast({
        title: "购物车已更新",
        description: `${product.name} 数量已更新为 ${cartQuantity + 1}`,
      })
    } else {
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
  }

  return (
    <Button onClick={handleAddToCart} className="w-full" size="lg">
      <ShoppingCart className="h-4 w-4" />
      {isInCart ? (
        <span className="ml-2">{cartQuantity}</span>
      ) : (
        <span className="ml-2">加入购物车</span>
      )}
    </Button>
  )
}

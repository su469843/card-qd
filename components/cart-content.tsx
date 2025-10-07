"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCart, updateCartItemQuantity, removeFromCart, getCartTotal, type CartItem } from "@/lib/cart"

export function CartContent() {
  const [cart, setCart] = useState<CartItem[]>([])
  const router = useRouter()

  useEffect(() => {
    const updateCart = () => {
      setCart(getCart())
    }

    updateCart()
    window.addEventListener("cartUpdated", updateCart)

    return () => {
      window.removeEventListener("cartUpdated", updateCart)
    }
  }, [])

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    updateCartItemQuantity(productId, newQuantity)
  }

  const handleRemove = (productId: number) => {
    removeFromCart(productId)
  }

  const handleCheckout = () => {
    router.push("/checkout")
  }

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-4">购物车是空的</p>
        <Link href="/">
          <Button>去购物</Button>
        </Link>
      </div>
    )
  }

  const total = getCartTotal()

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {cart.map((item) => (
          <Card key={item.productId}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.imageUrl || "/placeholder.svg?height=100&width=100&query=product"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
                    <p className="text-primary font-bold mt-1">¥{item.price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => handleRemove(item.productId)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">订单摘要</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-muted-foreground">
                <span>商品数量</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>小计</span>
                <span>¥{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">总计</span>
                <span className="text-2xl font-bold text-primary">¥{total.toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={handleCheckout} className="w-full" size="lg">
              去结算
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

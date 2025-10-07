"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { getCartItemCount } from "@/lib/cart"

export function CartButton() {
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      setItemCount(getCartItemCount())
    }

    updateCount()
    window.addEventListener("cartUpdated", updateCount)

    return () => {
      window.removeEventListener("cartUpdated", updateCount)
    }
  }, [])

  if (itemCount === 0) return null

  return (
    <Link href="/cart">
      <Button variant="outline" size="sm" className="relative bg-transparent">
        <ShoppingCart className="h-4 w-4" />
        <span className="ml-2">购物车</span>
        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          {itemCount}
        </span>
      </Button>
    </Link>
  )
}

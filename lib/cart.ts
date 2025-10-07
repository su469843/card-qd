"use client"

export interface CartItem {
  productId: number
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

const CART_KEY = "merchant_cart"

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return []
  const cart = localStorage.getItem(CART_KEY)
  return cart ? JSON.parse(cart) : []
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const cart = getCart()
  const existingItem = cart.find((i) => i.productId === item.productId)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({ ...item, quantity: 1 })
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event("cartUpdated"))
}

export function updateCartItemQuantity(productId: number, quantity: number) {
  const cart = getCart()
  const item = cart.find((i) => i.productId === productId)

  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      item.quantity = quantity
      localStorage.setItem(CART_KEY, JSON.stringify(cart))
      window.dispatchEvent(new Event("cartUpdated"))
    }
  }
}

export function removeFromCart(productId: number) {
  const cart = getCart()
  const newCart = cart.filter((i) => i.productId !== productId)
  localStorage.setItem(CART_KEY, JSON.stringify(newCart))
  window.dispatchEvent(new Event("cartUpdated"))
}

export function clearCart() {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event("cartUpdated"))
}

export function getCartTotal(): number {
  const cart = getCart()
  return cart.reduce((total, item) => total + item.price * item.quantity, 0)
}

export function getCartItemCount(): number {
  const cart = getCart()
  return cart.reduce((count, item) => count + item.quantity, 0)
}

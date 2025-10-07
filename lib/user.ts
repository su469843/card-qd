"use client"

const USER_ID_KEY = "merchant_user_id"

// 生成唯一的用户 ID
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// 获取或创建用户 ID
export function getUserId(): string {
  if (typeof window === "undefined") return ""

  let userId = localStorage.getItem(USER_ID_KEY)

  if (!userId) {
    userId = generateUserId()
    localStorage.setItem(USER_ID_KEY, userId)
  }

  return userId
}

// 清除用户 ID（用于测试或重置）
export function clearUserId() {
  if (typeof window === "undefined") return
  localStorage.removeItem(USER_ID_KEY)
}

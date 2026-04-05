/**
 * 认证数据验证工具
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: '邮箱不能为空' }
  }

  const trimmedEmail = email.trim()

  // RFC 5322简化正则表达式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: '邮箱格式无效' }
  }

  if (trimmedEmail.length > 100) {
    return { valid: false, error: '邮箱长度不能超过100个字符' }
  }

  return { valid: true }
}

/**
 * 验证密码强度
 * 要求：至少8位，包含大小写字母和数字
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '密码不能为空' }
  }

  if (password.length < 8) {
    return { valid: false, error: '密码长度至少为8位' }
  }

  if (password.length > 128) {
    return { valid: false, error: '密码长度不能超过128位' }
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      valid: false,
      error: '密码需包含大小写字母和数字',
    }
  }

  return { valid: true }
}

/**
 * 验证用户名
 * 要求：3-30位，只能包含字母、数字和下划线
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: '用户名不能为空' }
  }

  const trimmedUsername = username.trim()

  if (trimmedUsername.length < 3) {
    return { valid: false, error: '用户名至少需要3个字符' }
  }

  if (trimmedUsername.length > 30) {
    return { valid: false, error: '用户名不能超过30个字符' }
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(trimmedUsername)) {
    return {
      valid: false,
      error: '用户名只能包含字母、数字和下划线',
    }
  }

  return { valid: true }
}

/**
 * 验证密码强度并返回强度等级
 */
export function getPasswordStrength(password: string): {
  strength: 'weak' | 'fair' | 'good' | 'strong'
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (!password) {
    return { strength: 'weak', score: 0, feedback: ['密码不能为空'] }
  }

  // 长度检查
  if (password.length >= 8) {
    score += 20
  } else {
    feedback.push('至少8位字符')
  }

  if (password.length >= 12) {
    score += 10
  }

  if (password.length >= 16) {
    score += 10
  }

  // 字符多样性
  if (/[a-z]/.test(password)) {
    score += 15
  } else {
    feedback.push('包含小写字母')
  }

  if (/[A-Z]/.test(password)) {
    score += 15
  } else {
    feedback.push('包含大写字母')
  }

  if (/\d/.test(password)) {
    score += 15
  } else {
    feedback.push('包含数字')
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15
  } else {
    feedback.push('包含特殊字符')
  }

  // 确定强度等级
  let strength: 'weak' | 'fair' | 'good' | 'strong'
  if (score < 40) {
    strength = 'weak'
  } else if (score < 60) {
    strength = 'fair'
  } else if (score < 80) {
    strength = 'good'
  } else {
    strength = 'strong'
  }

  return { strength, score, feedback }
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { validateEmail, validatePassword, validateUsername, getPasswordStrength } from "@/lib/auth-validation"
import { validateAddress } from "@/lib/address-validation"

type RegistrationStep = 'basic' | 'address' | 'confirm'
type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  weak: 'bg-red-500',
  fair: 'bg-orange-500',
  good: 'bg-yellow-500',
  strong: 'bg-green-500',
}

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()

  // 基本信息
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 地址信息
  const [recipientName, setRecipientName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('CN')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [postalCode, setPostalCode] = useState('')

  // UI状态
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak')
  const [includeAddress, setIncludeAddress] = useState(false)

  // 处理密码变化并计算强度
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const strength = getPasswordStrength(value)
    setPasswordStrength(strength.strength)
  }

  // 验证基本信息
  const validateBasicInfo = (): boolean => {
    const newErrors: Record<string, string> = {}

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error || '邮箱格式无效'
    }

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.error || '用户名格式无效'
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error || '密码强度不足'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 验证地址信息
  const validateAddressInfo = (): boolean => {
    if (!includeAddress) return true

    const addressErrors = validateAddress({
      recipientName,
      phone,
      country,
      province,
      city,
      district,
      addressLine1,
      postalCode,
    })

    if (addressErrors.length > 0) {
      const errorMap: Record<string, string> = {}
      addressErrors.forEach((error) => {
        errorMap[error.field] = error.message
      })
      setErrors(errorMap)
      return false
    }

    return true
  }

  // 处理下一步
  const handleNextStep = async () => {
    if (currentStep === 'basic') {
      if (validateBasicInfo()) {
        setCurrentStep('address')
      }
    } else if (currentStep === 'address') {
      if (validateAddressInfo()) {
        setCurrentStep('confirm')
      }
    }
  }

  // 处理返回上一步
  const handlePreviousStep = () => {
    if (currentStep === 'address') {
      setCurrentStep('basic')
    } else if (currentStep === 'confirm') {
      setCurrentStep(includeAddress ? 'address' : 'basic')
    }
  }

  // 处理注册提交
  const handleSubmit = async () => {
    setIsLoading(true)
    setErrors({})

    try {
      const payload: any = {
        email,
        username,
        password,
      }

      if (includeAddress) {
        payload.address = {
          recipientName,
          phone,
          country,
          province,
          city,
          district,
          addressLine1,
          postalCode,
        }
      }

      const response = await fetch('/api/auth/register-with-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorData = result.error || {}
        
        if (errorData.code === 'INVALID_ADDRESS') {
          // 地址验证错误
          const addressErrorMap: Record<string, string> = {}
          if (errorData.details?.errors) {
            errorData.details.errors.forEach((err: any) => {
              addressErrorMap[err.field] = err.message
            })
          }
          setErrors(addressErrorMap)
        } else {
          // 其他错误
          const newErrors: Record<string, string> = {}
          if (errorData.code === 'EMAIL_EXISTS') {
            newErrors.email = errorData.message
          } else if (errorData.code === 'USERNAME_EXISTS') {
            newErrors.username = errorData.message
          } else {
            toast({
              title: '注册失败',
              description: errorData.message || '注册过程中出现错误',
              variant: 'destructive',
            })
          }
          setErrors(newErrors)
        }
        return
      }

      toast({
        title: '注册成功',
        description: '欢迎加入！正在跳转...',
      })

      // 保存session token
      if (result.data?.sessionToken) {
        localStorage.setItem('sessionToken', result.data.sessionToken)
      }

      // 跳转到首页
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('[Register] 注册失败:', error)
      toast({
        title: '注册失败',
        description: '网络错误，请检查连接后重试',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">创建账户</CardTitle>
          <CardDescription>
            {currentStep === 'basic' && '填写基本信息'}
            {currentStep === 'address' && includeAddress && '添加收货地址'}
            {currentStep === 'address' && !includeAddress && '完成注册'}
            {currentStep === 'confirm' && '确认信息'}
          </CardDescription>
          <div className="flex gap-2 pt-2">
            <div className={`h-1 flex-1 rounded-full ${currentStep === 'basic' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${['address', 'confirm'].includes(currentStep) ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${currentStep === 'confirm' ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 步骤1：基本信息 */}
          {currentStep === 'basic' && (
            <div className="space-y-4">
              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      const newErrors = { ...errors }
                      delete newErrors.email
                      setErrors(newErrors)
                    }
                  }}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 用户名 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (errors.username) {
                      const newErrors = { ...errors }
                      delete newErrors.username
                      setErrors(newErrors)
                    }
                  }}
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* 密码强度指示器 */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {['weak', 'fair', 'good', 'strong'].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            ['weak', 'fair', 'good', 'strong']
                              .slice(0, ['weak', 'fair', 'good', 'strong'].indexOf(passwordStrength) + 1)
                              .includes(level)
                              ? STRENGTH_COLORS[passwordStrength as PasswordStrength]
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      密码强度: <span className="capitalize">{passwordStrength}</span>
                    </p>
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* 确认密码 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) {
                      const newErrors = { ...errors }
                      delete newErrors.confirmPassword
                      setErrors(newErrors)
                    }
                  }}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button onClick={handleNextStep} className="w-full">
                下一步
              </Button>
            </div>
          )}

          {/* 步骤2：地址信息 */}
          {currentStep === 'address' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <input
                  type="checkbox"
                  id="includeAddress"
                  checked={includeAddress}
                  onChange={(e) => setIncludeAddress(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeAddress" className="text-sm cursor-pointer">
                  我要在注册时添加收货地址
                </label>
              </div>

              {includeAddress && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">收件人姓名</Label>
                    <Input
                      id="recipientName"
                      placeholder="张三"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className={errors.recipientName ? 'border-red-500' : ''}
                    />
                    {errors.recipientName && (
                      <p className="text-sm text-red-500">{errors.recipientName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">联系电话</Label>
                    <Input
                      id="phone"
                      placeholder="13800138000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="province">省份</Label>
                      <Input
                        id="province"
                        placeholder="北京"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className={errors.province ? 'border-red-500' : ''}
                      />
                      {errors.province && (
                        <p className="text-sm text-red-500">{errors.province}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">城市</Label>
                      <Input
                        id="city"
                        placeholder="北京"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && (
                        <p className="text-sm text-red-500">{errors.city}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">区/县</Label>
                    <Input
                      id="district"
                      placeholder="朝阳区"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className={errors.district ? 'border-red-500' : ''}
                    />
                    {errors.district && (
                      <p className="text-sm text-red-500">{errors.district}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">详细地址</Label>
                    <Input
                      id="addressLine1"
                      placeholder="某某街道某号"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className={errors.addressLine1 ? 'border-red-500' : ''}
                    />
                    {errors.addressLine1 && (
                      <p className="text-sm text-red-500">{errors.addressLine1}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">邮编</Label>
                    <Input
                      id="postalCode"
                      placeholder="100000"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className={errors.postalCode ? 'border-red-500' : ''}
                    />
                    {errors.postalCode && (
                      <p className="text-sm text-red-500">{errors.postalCode}</p>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePreviousStep} className="flex-1">
                  上一步
                </Button>
                <Button onClick={handleNextStep} className="flex-1">
                  下一步
                </Button>
              </div>
            </div>
          )}

          {/* 步骤3：确认信息 */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  请确认您的信息无误后点击注册
                </AlertDescription>
              </Alert>

              <div className="space-y-3 p-4 bg-muted/50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">邮箱:</span>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">用户名:</span>
                  <span className="font-medium">{username}</span>
                </div>
                {includeAddress && (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <p className="text-muted-foreground mb-2">收货地址:</p>
                      <p className="font-medium">{recipientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {country} {province} {city} {district}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {addressLine1}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        邮编: {postalCode}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePreviousStep} className="flex-1">
                  上一步
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
                  {isLoading ? '注册中...' : '完成注册'}
                </Button>
              </div>
            </div>
          )}

          {/* 登录链接 */}
          {currentStep === 'basic' && (
            <p className="text-center text-sm text-muted-foreground">
              已有账户？{' '}
              <Link href="/login" className="text-primary hover:underline">
                直接登录
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 地址验证和规范化工具
 */

export interface AddressData {
  recipientName: string
  phone: string
  country: string
  province: string
  city: string
  district: string
  addressLine1: string
  addressLine2?: string
  postalCode: string
  label?: string
}

export interface AddressValidationError {
  field: string
  message: string
  code: string
}

/**
 * 验证电话号码格式
 */
export function validatePhone(phone: string): boolean {
  // 支持多种格式：+86 13800138000, 13800138000, 010-12345678
  const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{7,15}$/
  return phoneRegex.test(phone.replace(/[-.\s]/g, ''))
}

/**
 * 验证邮编格式
 */
export function validatePostalCode(code: string, country: string): boolean {
  const patterns: { [key: string]: RegExp } = {
    CN: /^\d{6}$/, // 中国邮编6位
    US: /^\d{5}(-\d{4})?$/, // 美国ZIP码
    GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, // 英国邮编
  }
  
  const pattern = patterns[country.toUpperCase()]
  if (!pattern) return true // 未知国家，不验证
  return pattern.test(code)
}

/**
 * 验证地址数据完整性
 */
export function validateAddress(data: Partial<AddressData>): AddressValidationError[] {
  const errors: AddressValidationError[] = []

  // 验证收件人名字
  if (!data.recipientName?.trim()) {
    errors.push({
      field: 'recipientName',
      message: '请输入收件人姓名',
      code: 'RECIPIENT_NAME_REQUIRED',
    })
  } else if (data.recipientName.length > 50) {
    errors.push({
      field: 'recipientName',
      message: '收件人姓名不能超过50个字符',
      code: 'RECIPIENT_NAME_TOO_LONG',
    })
  }

  // 验证电话号码
  if (!data.phone?.trim()) {
    errors.push({
      field: 'phone',
      message: '请输入联系电话',
      code: 'PHONE_REQUIRED',
    })
  } else if (!validatePhone(data.phone)) {
    errors.push({
      field: 'phone',
      message: '请输入有效的电话号码',
      code: 'INVALID_PHONE_FORMAT',
    })
  }

  // 验证国家
  if (!data.country?.trim()) {
    errors.push({
      field: 'country',
      message: '请选择国家/地区',
      code: 'COUNTRY_REQUIRED',
    })
  }

  // 验证省份
  if (!data.province?.trim()) {
    errors.push({
      field: 'province',
      message: '请选择省份/州',
      code: 'PROVINCE_REQUIRED',
    })
  }

  // 验证城市
  if (!data.city?.trim()) {
    errors.push({
      field: 'city',
      message: '请选择城市',
      code: 'CITY_REQUIRED',
    })
  }

  // 验证地区
  if (!data.district?.trim()) {
    errors.push({
      field: 'district',
      message: '请选择区/县',
      code: 'DISTRICT_REQUIRED',
    })
  }

  // 验证详细地址
  if (!data.addressLine1?.trim()) {
    errors.push({
      field: 'addressLine1',
      message: '请输入详细地址',
      code: 'ADDRESS_LINE1_REQUIRED',
    })
  } else if (data.addressLine1.length > 100) {
    errors.push({
      field: 'addressLine1',
      message: '详细地址不能超过100个字符',
      code: 'ADDRESS_LINE1_TOO_LONG',
    })
  }

  // 验证邮编
  if (!data.postalCode?.trim()) {
    errors.push({
      field: 'postalCode',
      message: '请输入邮编',
      code: 'POSTAL_CODE_REQUIRED',
    })
  } else if (!validatePostalCode(data.postalCode, data.country || '')) {
    errors.push({
      field: 'postalCode',
      message: '请输入有效的邮编',
      code: 'INVALID_POSTAL_CODE',
    })
  }

  return errors
}

/**
 * 规范化地址数据
 */
export function normalizeAddress(data: Partial<AddressData>): AddressData {
  return {
    recipientName: (data.recipientName || '').trim(),
    phone: (data.phone || '').trim(),
    country: (data.country || '').trim(),
    province: (data.province || '').trim(),
    city: (data.city || '').trim(),
    district: (data.district || '').trim(),
    addressLine1: (data.addressLine1 || '').trim(),
    addressLine2: (data.addressLine2 || '').trim(),
    postalCode: (data.postalCode || '').trim(),
    label: (data.label || '家').trim(),
  }
}

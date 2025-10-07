import { NextResponse } from 'next/server'
import { ApiResponse } from '@/types'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.details
      } as ApiResponse,
      { status: error.statusCode }
    )
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      } as ApiResponse,
      { status: 500 }
    )
  }
  
  return NextResponse.json(
    {
      success: false,
      error: 'Unknown error occurred'
    } as ApiResponse,
    { status: 500 }
  )
}

export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message
  } as ApiResponse<T>)
}

export async function validateRequestBody<T>(request: Request, schema?: (body: any) => T): Promise<T> {
  try {
    const body = await request.json()
    
    if (schema) {
      return schema(body)
    }
    
    return body
  } catch (error) {
    throw new ApiError(400, 'Invalid request body')
  }
}
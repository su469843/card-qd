import { neon } from "@neondatabase/serverless"

const createSql = () => {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    
    console.warn("DATABASE_URL environment variable is not set - using mock database")
    
    return async (strings: TemplateStringsArray, ...values: any[]) => {
      return []
    }
  }
  
  return neon(process.env.DATABASE_URL)
}

export const sql = createSql()

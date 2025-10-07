import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn("DATABASE_URL environment variable is not set - using mock database")
  }
}

const mockSql = {
  async template(strings: TemplateStringsArray, ...values: any[]) {
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    
    if (!process.env.DATABASE_URL) {
      return []
    }
    
    const realSql = neon(process.env.DATABASE_URL)
    return realSql(strings, ...values)
  }
}

export const sql = mockSql.template

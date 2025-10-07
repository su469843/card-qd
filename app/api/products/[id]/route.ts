import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = Number.parseInt(params.id)

    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: "无效的商品ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, price, image_url, description, tags } = body

    if (!name || !price) {
      return NextResponse.json({ error: "商品名称和价格为必填项" }, { status: 400 })
    }

    await sql`
      UPDATE products
      SET 
        name = ${name},
        price = ${price},
        image_url = ${image_url},
        description = ${description},
        tags = ${tags}
      WHERE id = ${productId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 更新商品错误:", error)
    return NextResponse.json({ error: "更新商品失败" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = Number.parseInt(params.id)

    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: "无效的商品ID" }, { status: 400 })
    }

    await sql`
      DELETE FROM products
      WHERE id = ${productId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] 删除商品错误:", error)
    return NextResponse.json({ error: "删除商品失败" }, { status: 500 })
  }
}

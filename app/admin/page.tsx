"use client"

import Link from "next/link"
import { Package, ShoppingBag, LogOut, Ticket, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">管理员后台</h1>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-transparent">
                返回商城
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => {
                sessionStorage.removeItem("admin_authenticated")
                window.location.reload()
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              登出
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <Link href="/admin/products">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>商品管理</CardTitle>
                    <CardDescription>添加、编辑和管理商品</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">管理商城中的所有商品信息</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/orders">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>订单管理</CardTitle>
                    <CardDescription>确认付款和查看订单</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">输入付款码确认用户付款</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/coupons">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>优惠码管理</CardTitle>
                    <CardDescription>创建和管理优惠码</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">添加、编辑和删除优惠码</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/cards">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>卡密管理</CardTitle>
                    <CardDescription>管理商品卡密库存</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">批量添加和管理卡密</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}

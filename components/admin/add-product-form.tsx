"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { X, ImageIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export function AddProductForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [useCardDelivery, setUseCardDelivery] = useState(false)
  const [isPresale, setIsPresale] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "文件类型错误",
          description: "只能上传图片文件",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "文件太大",
          description: "图片大小不能超过 5MB",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClearImage = () => {
    setImageFile(null)
    setImagePreview("")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    let imageUrl = ""

    if (imageFile) {
      setIsUploading(true)
      try {
        const uploadFormData = new FormData()
        uploadFormData.append("file", imageFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) throw new Error("图片上传失败")

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      } catch (error) {
        console.error("[v0] 图片上传错误:", error)
        toast({
          title: "图片上传失败",
          description: "请重试",
          variant: "destructive",
        })
        setIsLoading(false)
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }

    const data = {
      name: formData.get("name") as string,
      price: formData.get("price") as string,
      imageUrl: imageUrl || (formData.get("imageUrl") as string),
      description: formData.get("description") as string,
      tags: formData.get("tags") as string,
      useCardDelivery,
      maxPerUser: formData.get("maxPerUser") ? Number(formData.get("maxPerUser")) : null,
      totalStock: formData.get("totalStock") ? Number(formData.get("totalStock")) : null,
      saleEndTime: formData.get("saleEndTime") || null,
      isPresale,
      presaleStartTime: formData.get("presaleStartTime") || null,
    }

    if (!data.name || !data.price) {
      toast({
        title: "请填写必填项",
        description: "商品名称和价格为必填项",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("添加失败")

      toast({
        title: "添加成功",
        description: "商品已成功添加",
      })

      router.push("/admin/products")
      router.refresh()
    } catch (error) {
      console.error("[v0] 添加商品错误:", error)
      toast({
        title: "添加失败",
        description: "请重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>商品信息</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              商品名称 <span className="text-destructive">*</span>
            </Label>
            <Input id="name" name="name" placeholder="请输入商品名称" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">
              商品价格 <span className="text-destructive">*</span>
            </Label>
            <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="请输入商品价格" required />
          </div>

          <div className="space-y-2">
            <Label>商品图片（可选）</Label>

            {imagePreview ? (
              <div className="relative w-full h-48 border-2 border-border rounded-lg overflow-hidden">
                <img src={imagePreview || "/placeholder.svg"} alt="预览" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleClearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input type="file" id="image-upload" accept="image/*" onChange={handleImageChange} className="hidden" />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">点击上传图片</p>
                      <p className="text-xs text-muted-foreground">支持 JPG、PNG、GIF，最大 5MB</p>
                    </div>
                  </div>
                </label>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">或</span>
              </div>
            </div>

            <Input id="imageUrl" name="imageUrl" type="url" placeholder="输入图片链接 https://example.com/image.jpg" />
            <p className="text-xs text-muted-foreground">留空将使用默认占位图</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">商品标签（可选）</Label>
            <Input id="tags" name="tags" placeholder="例如：电子产品,配件" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">商品详情（可选）</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="请输入商品详细介绍"
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="use-card-delivery" className="text-base font-medium">
                开启卡密发货
              </Label>
              <p className="text-sm text-muted-foreground">启用后，订单将自动分配卡密，用户可在订单中查看</p>
            </div>
            <Switch id="use-card-delivery" checked={useCardDelivery} onCheckedChange={setUseCardDelivery} />
          </div>

          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/10">
            <h3 className="text-lg font-semibold">购买限制设置</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPerUser">每人限购数量</Label>
                <Input id="maxPerUser" name="maxPerUser" type="number" min="1" placeholder="不填则不限制" />
                <p className="text-xs text-muted-foreground">每个用户最多可购买的数量</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalStock">总库存数量</Label>
                <Input id="totalStock" name="totalStock" type="number" min="0" placeholder="不填则不限制" />
                <p className="text-xs text-muted-foreground">商品总库存，售完即止</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleEndTime">销售截止时间</Label>
                <Input id="saleEndTime" name="saleEndTime" type="datetime-local" />
                <p className="text-xs text-muted-foreground">到期后将无法购买</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="presaleStartTime">预售开始时间</Label>
                <Input id="presaleStartTime" name="presaleStartTime" type="datetime-local" disabled={!isPresale} />
                <p className="text-xs text-muted-foreground">到达此时间后才可购买</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
              <div className="space-y-0.5">
                <Label htmlFor="is-presale" className="text-sm font-medium">
                  预售模式
                </Label>
                <p className="text-xs text-muted-foreground">启用后，需等到预售时间才能购买</p>
              </div>
              <Switch id="is-presale" checked={isPresale} onCheckedChange={setIsPresale} />
            </div>
          </div>

          <Button type="submit" disabled={isLoading || isUploading} className="w-full" size="lg">
            {isUploading ? "上传图片中..." : isLoading ? "添加中..." : "添加商品"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

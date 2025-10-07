"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Loader2 } from "lucide-react"
import Image from "next/image"

interface Product {
  id: number
  name: string
  price: string
  image_url: string | null
  description: string | null
  tags: string | null
}

export function EditProductForm({ product }: { product: Product }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: product.name,
    price: product.price,
    imageUrl: product.image_url || "",
    description: product.description || "",
    tags: product.tags || "",
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "文件类型错误",
        description: "请选择图片文件",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "文件过大",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.price.trim()) {
      toast({
        title: "请填写必填项",
        description: "商品名称和价格为必填项",
        variant: "destructive",
      })
      return
    }

    const price = Number.parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      toast({
        title: "价格格式错误",
        description: "请输入有效的价格",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let finalImageUrl = formData.imageUrl

      if (imageFile) {
        setUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", imageFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) throw new Error("图片上传失败")

        const { url } = await uploadResponse.json()
        finalImageUrl = url
        setUploading(false)
      }

      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          price: price.toString(),
          image_url: finalImageUrl || null,
          description: formData.description.trim() || null,
          tags: formData.tags.trim() || null,
        }),
      })

      if (!response.ok) throw new Error("更新商品失败")

      toast({
        title: "更新成功",
        description: "商品信息已更新",
      })

      router.push("/admin/products")
      router.refresh()
    } catch (error) {
      console.error("[v0] 更新商品错误:", error)
      toast({
        title: "更新失败",
        description: "请重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="image">商品图片（可选）</Label>
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                  <Image src={imagePreview || "/placeholder.svg"} alt="预览" fill className="object-contain" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                      setFormData({ ...formData, imageUrl: "" })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">上传图片</span>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">或</span>
                </div>
              </div>

              <Input
                id="image-url"
                placeholder="输入图片链接"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value })
                  if (e.target.value) {
                    setImagePreview(e.target.value)
                    setImageFile(null)
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              商品名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="请输入商品名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">
              商品价格 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="请输入商品价格"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">商品标签（可选）</Label>
            <Input
              id="tags"
              placeholder="例如：热销、新品、限时优惠"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <MarkdownEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="请输入商品详细介绍，支持Markdown语法..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || uploading} className="flex-1">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                "更新商品"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function MarkdownEditor({ value, onChange, placeholder = "请输入markdown内容..." }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState("edit")

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const renderPreview = () => {
    if (!value) {
      return <div className="text-muted-foreground text-sm p-4">暂无内容，请在编辑模式下输入markdown</div>
    }

    return (
      <div className="prose prose-sm max-w-none p-4">
        <h1 className="text-2xl font-bold mb-4">预览效果</h1>
        <div className="border-l-4 border-primary pl-4 bg-muted/20 p-2 mb-4">
          <p className="text-muted-foreground text-sm">
            这是一个简单的预览，实际效果可能因样式配置而有所不同
          </p>
        </div>
        <div className="space-y-3">
          {value.split('\n').map((line, index) => (
            <div key={index} className="min-h-4">
              {line.trim() === '' ? <br /> : (
                <span className="whitespace-pre-wrap">{line}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="markdown-editor">商品详情（支持Markdown）</Label>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">编辑模式</TabsTrigger>
          <TabsTrigger value="preview">预览模式</TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="mt-0">
          <Textarea
            id="markdown-editor"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={10}
            className="font-mono text-sm resize-none"
          />
          <div className="text-xs text-muted-foreground mt-2">
            支持Markdown语法：**粗体**、*斜体*、`代码`、[链接](url)、- 列表等
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          <div className="border border-input rounded-md min-h-[200px] bg-background">
            {renderPreview()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
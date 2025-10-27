import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

function FileUploader() {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      alert('请先选择一个文件。')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      // 示例：发送到你的 /api/upload 路由
      // const response = await fetch("/api/upload", {
      //   method: "POST",
      //   body: formData,
      // });

      // if (!response.ok) {
      //   throw new Error("上传失败");
      // }
      // const data = await response.json();

      console.log('文件上传逻辑在这里执行', formData.get('file'))
      alert(`文件 "${file.name}" 准备上传!`)
      // 成功上传后，清空文件状态
      setFile(null)
    } catch (error) {
      console.error('上传出错:', error)
      alert('文件上传失败。')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <Label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-input bg-background hover:bg-accent"
      >
        <Upload className="w-10 h-10 text-muted-foreground" />
        <span className="mt-2 text-sm text-muted-foreground">
          点击或拖拽文件到这里上传
        </span>
      </Label>

      <Input
        id="file-upload"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        // 在这里限制文件类型
        // accept="image/png, image/jpeg"
      />

      {file && (
        <div className="text-sm font-medium">
          已选择文件: <span className="text-muted-foreground">{file.name}</span>
        </div>
      )}

      <Button type="submit" disabled={!file} className="w-full">
        上传文件
      </Button>
    </form>
  )
}

export default FileUploader

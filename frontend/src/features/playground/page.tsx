import { apiClient } from '@/api'
import { useState, useEffect } from 'react'
import { uploadFile } from '../upload/api'
import { getImages } from '../image/api'
import RegisterForm from '../auth/components/register-form'
import LoginForm from '../auth/components/login-form'

const pingApi = async () => {
  const response = await apiClient.get('/ping')
  return response.data
}

export default function PlaygroundPage() {
  const [ping, setPing] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [images, setImages] = useState<any[]>([])
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (file) {
      uploadFile(file)
    }
  }
  useEffect(() => {
    getImages().then(setImages)
  }, [])
  useEffect(() => {
    ;(async () => {
      const ping = await pingApi()
      setPing(JSON.stringify(ping))
    })()
  }, [])
  return (
    <div className="p-2 space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-2">注册</h2>
        <RegisterForm />
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">登录</h2>
        <LoginForm />
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">Ping</h2>
        <div>{ping}</div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">Upload</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button type="submit">Upload</button>
        </form>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">Images</h2>
        <pre>
          {JSON.stringify(images, null, 2)}
        </pre>
      </div>
    </div>
  )
}

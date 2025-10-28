import { apiClient } from '@/api'
import { useState, useEffect } from 'react'

const pingApi = async () => {
  const response = await apiClient.get('/ping')
  return response.data
}

const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/photos/upload', formData)
  return response.data
}

export default function PlaygroundPage() {
  const [ping, setPing] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (file) {
      uploadFile(file)
    }
  }
  useEffect(() => {
    ;(async () => {
      const ping = await pingApi()
      setPing(JSON.stringify(ping))
    })()
  }, [])
  return (
    <div className="p-2">
      <div>Ping: {ping}</div>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit">Upload</button>
      </form>
    </div>
  )
}

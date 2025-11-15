import { apiClient } from '@/api'
import { useState, useEffect } from 'react'
import { uploadFile } from '../upload/api'
import { getImages } from '../image/api'

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
    <div className="p-2">
      <div>Ping: {ping}</div>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit">Upload</button>
      </form>
      <pre>
        {JSON.stringify(images, null, 2)}
      </pre>
    </div>
  )
}

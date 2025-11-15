import { apiClient } from '@/api'
import { useState, useEffect } from 'react'
import { uploadFile } from '../upload/api'
import { getImages } from '../image/api'
import RegisterForm from '../auth/components/register-form'
import LoginForm from '../auth/components/login-form'
import { authMe } from '../auth/api'
import { Button } from '@/components/ui/button'

const pingApi = async () => {
  const response = await apiClient.get('/ping')
  return response.data
}

export default function PlaygroundPage() {
  const [ping, setPing] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [userInfo, setUserInfo] = useState<string | null>(null)
  const [loadingUserInfo, setLoadingUserInfo] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (file) {
      uploadFile(file)
    }
  }

  const handleGetUserInfo = async () => {
    setLoadingUserInfo(true)
    setUserError(null)
    setUserInfo(null)
    try {
      const data = await authMe()
      setUserInfo(JSON.stringify(data, null, 2))
    } catch (err: any) {
      setUserError(err.response?.data?.message || err.message || '获取用户信息失败')
    } finally {
      setLoadingUserInfo(false)
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
        <h2 className="text-lg font-bold mb-2">个人信息</h2>
        <Button onClick={handleGetUserInfo} disabled={loadingUserInfo}>
          {loadingUserInfo ? '获取中...' : '获取个人信息'}
        </Button>
        {userError && (
          <div className="text-red-500 text-sm mt-2">{userError}</div>
        )}
        {userInfo && (
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto mt-2">
            {userInfo}
          </pre>
        )}
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

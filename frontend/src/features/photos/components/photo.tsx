import { useState, useEffect } from 'react';
import { get_image_content } from '@/api';

interface AuthImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  imageId: number;
  token: string;
}

export const PhotoView = ({ imageId, token, className, ...props }: AuthImageProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true; // 防止组件卸载后设置状态
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        setLoading(true);
        // 调用你定义的函数，获取 objectUrl
        objectUrl = await get_image_content(imageId, token);

        if (active) {
          setImageSrc(objectUrl);
          setLoading(false);
        }
      } catch (error) {
        console.error(`Failed to load image ${imageId}`, error);
        if (active) setLoading(false);
      }
    };

    if (imageId && token) {
      fetchImage();
    }

    // 清理函数：防止内存泄漏
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageId, token]);

  if (loading) {
    // 这里可以返回一个 Skeleton 骨架屏或者加载转圈
    return <div className={`animate-pulse bg-gray-200 ${className}`} />;
  }

  if (!imageSrc) {
    // 加载失败显示的占位图
    return <div className={`bg-gray-100 flex items-center justify-center ${className}`}>Error</div>;
  }

  return (
    <img
      src={imageSrc}
      className={className}
      {...props}
    />
  );
};
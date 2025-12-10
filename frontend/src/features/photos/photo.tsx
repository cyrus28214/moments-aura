import { useState, useEffect } from 'react';
import { get_image_content } from '@/api';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface AuthImageProps extends HTMLMotionProps<"img"> {
  imageId: string;
  token: string;
  showSkeleton?: boolean;
}

export const PhotoView = ({ imageId, token, className, style, showSkeleton = true, ...props }: AuthImageProps) => {
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
    if (showSkeleton) {
      return <motion.div className={`animate-pulse bg-gray-200 ${className} w-full h-full`} style={style} {...(props as any)} />;
    }
    return <div className={`w-full h-full ${className}`} style={{ ...style, opacity: 0 } as any} />;
  }

  if (!imageSrc) {
    // 加载失败显示的占位图
    return <motion.div className={`bg-gray-100 flex items-center justify-center ${className}`} style={style} {...(props as any)}>Error</motion.div>;
  }

  return (
    <motion.img
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      src={imageSrc}
      className={className}
      style={style}
      {...props}
    />
  );
};
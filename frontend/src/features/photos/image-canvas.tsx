import React, { useRef, useEffect, useState } from 'react';

type ImageCanvasProps = {
    imageSrc: string;
    brightness: number;
    contrast: number;
    saturation: number;
} & React.CanvasHTMLAttributes<HTMLCanvasElement>;

export const ImageCanvas = ({
    imageSrc,
    brightness,
    contrast,
    saturation,
    className,
    ...props
}: ImageCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!imageSrc) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;

        img.onload = () => {
            setImageObj(img);
        };

        img.onerror = () => {
            setImageObj(null);
        };
    }, [imageSrc]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageObj) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = imageObj.width;
        canvas.height = imageObj.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

        ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

    }, [imageObj, brightness, contrast, saturation]);

    return (
        <canvas
            ref={canvasRef}
            {...props}
        />
    );
}
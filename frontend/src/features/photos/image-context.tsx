import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { add_tags_batch, delete_images, delete_tags_batch, get_image_content, type Image, list_images, upload_image } from '@/api';
import { toast } from 'sonner';

interface ImagesContextType {
    images: Image[];
    isLoading: boolean;
    refreshImages: () => Promise<void>;
    uploadImages: (files: File[]) => Promise<void>;
    deleteImages: (photo_ids: string[]) => Promise<void>;
    addTag: (photo_id: string, tag: string) => Promise<void>;
    removeTag: (photo_id: string, tag: string) => Promise<void>;

    // 内部方法
    fetchBlobInternal: (photo_id: string) => Promise<string | undefined>;
}

const ImagesContext = createContext<ImagesContextType | undefined>(undefined);

export const ImagesProvider = ({ token, children }: { token: string, children: React.ReactNode }) => {
    const [images, setImages] = useState<Image[]>([]);
    const blobCacheRef = useRef<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(false);

    const refreshImages = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const { photos } = await list_images(token);

            setImages(photos);
        } catch (error) {
            console.error("Failed to fetch images", error);
            toast.error("Failed to refresh gallery");
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const fetchBlobInternal = useCallback(async (photo_id: string) => {
        if (blobCacheRef.current.has(photo_id)) {
            return blobCacheRef.current.get(photo_id);
        }

        try {
            const blobUrl = await get_image_content(photo_id, token);
            blobCacheRef.current.set(photo_id, blobUrl);
            return blobUrl;
        } catch (error) {
            console.error(`Failed to load image ${photo_id}`, error);
            return undefined;
        }

    }, [token]);

    const uploadImages = useCallback(async (files: File[]) => {
        try {
            await Promise.all(files.map(file => upload_image(file, token)));
            refreshImages();
        } catch (error) {
            console.error("Failed to upload image", error);
            toast.error("Failed to upload image");
        }
    }, [token]);

    const deleteImages = useCallback(async (photo_ids: string[]) => {
        try {
            await delete_images(photo_ids, token);
            refreshImages();
        } catch (error) {
            console.error("Failed to delete image", error);
            toast.error("Failed to delete image");
        }
    }, [token]);

    const addTag = async (photo_id: string, tag: string) => {
        try {
            await add_tags_batch({ tag_names: [tag], photo_ids: [photo_id] }, token);
            refreshImages();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add tag");
        }
    };

    const removeTag = async (photo_id: string, tag: string) => {
        try {
            await delete_tags_batch({ tag_names: [tag], photo_ids: [photo_id] }, token);
            refreshImages();
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove tag");
        }
    };

    useEffect(() => {
        refreshImages();
    }, [refreshImages]);

    const value = {
        images,
        isLoading,
        refreshImages,
        uploadImages,
        deleteImages,
        addTag,
        removeTag,
        fetchBlobInternal
    };

    return (
        <ImagesContext.Provider value={value}>
            {children}
        </ImagesContext.Provider>
    );
};

export const useImages = () => {
    const context = useContext(ImagesContext);
    if (context === undefined) {
        throw new Error('useImages must be used within an ImagesProvider');
    }
    return context;
};

export const useImageBlob = (photo_id: string) => {
    const { fetchBlobInternal } = useImages();
    const [url, setUrl] = useState<string | undefined>(undefined);

    console.log({ source: "useImageBlob", photo_id, url });

    useEffect(() => {
        // setUrl(undefined); // 如果photo_id改变了，不能再使用上次的，设置成undefined

        const load = async () => {
            const res = await fetchBlobInternal(photo_id);
            setUrl(res);
        };

        load();

    }, [photo_id, fetchBlobInternal]);

    return { url };
};
import { useState, useMemo, useCallback } from 'react';
import { type Image } from '@/api';

export function usePhotoSelection(serverImages: Image[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const displayImages = useMemo(() => {
        return serverImages.map((img, index) => ({
            ...img,
            selected: selectedIds.has(img.id),
            index
        }));
    }, [serverImages, selectedIds]);

    const selectedCount = selectedIds.size;

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }, []);

    const isAllSelected = selectedCount === serverImages.length;
    const toggleSelectAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(serverImages.map(i => i.id)));
        }
    }, [isAllSelected, serverImages]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    return {
        selectedIds,
        setSelectedIds,
        displayImages,
        toggleSelection,
        isAllSelected,
        toggleSelectAll,
        clearSelection
    };
}
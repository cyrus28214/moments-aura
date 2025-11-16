import type { Image } from '../api'

export function ImageGrid({ images }: { images: Image[] }) {
    return <div className="grid grid-cols-3 gap-4">
        {images.map((image) => <div key={image.id} className="relative overflow-hidden">
            <img src={`/api/images/${image.id}/content`} alt={image.file_name} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-sm">
                {image.file_name}
            </div>
        </div>)}
    </div>
}
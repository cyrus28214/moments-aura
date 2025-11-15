import type { Image } from '../api'

export function ImageList({ images }: { images: Image[] }) {
    return (
        <div>
            {images.map((image) => <>
                <div key={image.id}>{image.file_name}</div>
                <img src={`/api/images/${image.id}/content`} alt={image.file_name} />
            </>)}
        </div>
    )
}
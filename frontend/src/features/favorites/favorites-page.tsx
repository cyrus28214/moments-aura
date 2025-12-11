import { HeartIcon } from "lucide-react";

export default function FavoritesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <div className="p-4 bg-muted rounded-full">
                <HeartIcon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold">Favorites</h2>
            <p>Under development, coming soon...</p>
        </div>
    );
}

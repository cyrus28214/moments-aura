import { SearchIcon, TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useImages } from '@/features/photos/image-context';
import { PhotosPage } from '../photos/photos-page';
import { list_tags, type TagWithCount } from '@/api';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDashboardContext } from '../layout/dashboard-layout';

export default function SearchPage() {
    const { token } = useDashboardContext();
    return (
        <SearchPageContent token={token} />
    );
}

function SearchPageContent({ token }: { token: string }) {
    const { filterTags, setFilterTags, filterUntagged, setFilterUntagged } = useImages();
    // Local state to debounce or just simple input
    // We lift the input UI here, but pass logical control via Context

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b">
                <h1 className="text-2xl font-bold mb-4">Search</h1>
                <div className="relative max-w-md">
                    <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by tags..."
                        value={filterTags || ""}
                        onChange={(e) => setFilterTags(e.target.value)}
                        className="pl-10 h-10"
                    />
                </div>
                <div className="mt-4 flex gap-2">
                    <Button
                        variant={filterUntagged ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterUntagged(!filterUntagged)}
                        className="gap-2"
                    >
                        <TagIcon className="w-4 h-4" />
                        Untagged
                    </Button>
                </div>
                {/* Tag Cloud */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                        const isSelected = filterTags?.split(',').map(t => t.trim()).includes(tag.name);
                        return (
                            <Badge
                                key={tag.name}
                                variant={isSelected ? "default" : "secondary"}
                                className={cn("cursor-pointer hover:opacity-80 transition-opacity", isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}
                                onClick={() => toggleTag(tag.name)}
                            >
                                {tag.name} ({tag.count})
                            </Badge>
                        );
                    })}
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <PhotosPage token={token} />
            </div>
        </div>
    );
}

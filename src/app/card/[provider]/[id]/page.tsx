"use client";

import { useParams } from "next/navigation";
import { SongCard } from "@/components/song-card";
import { useLyrics } from "@/hooks/use-api";
import { Provider } from "@/components/provider-selector";
import { Skeleton } from "@/components/ui/skeleton";

export default function CardPage() {
    const params = useParams();
    const provider = params.provider as Provider;
    const id = params.id as string;

    // We use useLyrics to get coverUrl and songInfo
    const { data: lyricsData, isLoading, error } = useLyrics(id, provider);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent p-0">
                <div className="w-full max-w-md mx-auto aspect-[4/1] md:aspect-[5/1] rounded-xl bg-zinc-900 border border-white/10 shadow-xl overflow-hidden relative">
                    <div className="p-3 flex items-center gap-4 h-20 md:h-24">
                        <Skeleton className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg bg-zinc-800" />
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                            <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !lyricsData) {
        const safeSongInfo = {
            name: "无法加载",
            artist: ["未知"],
            album: "",
        };
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent p-0">
                <SongCard
                    id={id}
                    provider={provider}
                    coverUrl=""
                    songInfo={safeSongInfo}
                />
            </div>
        );
    }

    const { coverUrl, songInfo } = lyricsData;

    // Fallback for songInfo if missing
    const safeSongInfo = songInfo || {
        name: "未知歌曲",
        artist: ["未知艺术家"],
        album: "未知专辑",
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent p-0">
            <SongCard
                id={id}
                provider={provider}
                coverUrl={coverUrl || ""}
                songInfo={safeSongInfo}
            />
        </div>
    );
}

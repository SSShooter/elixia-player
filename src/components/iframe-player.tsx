"use client";

import { useState, useEffect, useRef } from "react";
import { Provider } from "@/components/provider-selector";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface IframePlayerProps {
    id: string;
    provider: Provider;
    coverUrl: string;
    songInfo: {
        name: string;
        artist: string[];
        album: string;
    };
}

export function IframePlayer({ id, provider, coverUrl, songInfo }: IframePlayerProps) {
    const [audioUrl, setAudioUrl] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    // Helper function to convert HTTP to HTTPS
    const convertToHttps = (url: string): string => {
        if (url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        return url;
    };

    useEffect(() => {
        let mounted = true;

        async function fetchUrl() {
            if (!id || !provider) return;

            setLoading(true);
            setError("");
            setAudioUrl("");
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);

            try {
                const cookie = typeof window !== 'undefined' ? localStorage.getItem(`meting_cookie_${provider}`) || undefined : undefined;
                const res = await fetch("/api/url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ provider, id, cookie }),
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch song URL");
                }

                const data = await res.json();
                if (mounted) {
                    if (data.url) {
                        setAudioUrl(convertToHttps(data.url));
                    } else {
                        setError("无法获取播放链接");
                    }
                }
            } catch (err) {
                if (mounted) {
                    setError("获取播放链接失败");
                    console.error(err);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchUrl();

        return () => {
            mounted = false;
        };
    }, [id, provider]);

    const togglePlay = () => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Play failed:", e));
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const time = audioRef.current.currentTime;
            setCurrentTime(time);
        }
    };

    const onLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const onEnded = () => {
        setIsPlaying(false);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const handleSeek = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    return (
        <div className="relative w-full overflow-hidden rounded-xl bg-zinc-900 border border-white/10 shadow-xl font-sans text-white group select-none">
            {/* Dynamic Background */}
            <div
                className="absolute inset-0 opacity-30 bg-cover bg-center blur-xl transition-all duration-1000"
                style={{ backgroundImage: `url(${coverUrl || "/placeholder.svg"})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 backdrop-blur-sm" />

            {/* Content */}
            <div className="relative p-3 flex items-center gap-4 h-20 md:h-24">

                {/* Cover Art (Rotating if playing?) */}
                <div className="relative shrink-0 w-14 h-14 md:w-16 md:h-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={coverUrl || "/placeholder.svg"}
                        alt={songInfo.name}
                        className={cn(
                            "w-full h-full object-cover rounded-full shadow-lg ring-2 ring-white/10 transition-transform duration-[3s] ease-linear",
                            isPlaying && "animate-[spin_4s_linear_infinite]"
                        )}
                        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                    />
                    <div className="absolute inset-0 rounded-full bg-black/10 ring-1 ring-inset ring-black/20" />
                </div>

                {/* Info & Controls */}
                <div className="flex-1 min-w-0 flex flex-col justify-center h-full gap-1">
                    <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                            <h3 className="font-bold text-base md:text-lg truncate leading-tight" title={songInfo.name}>
                                {songInfo.name}
                            </h3>
                            <p className="text-xs md:text-sm text-white/60 truncate" title={songInfo.artist.join(" / ")}>
                                {songInfo.artist.join(" / ")}
                            </p>
                        </div>

                        {/* Play Button (Small) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-full hover:bg-white/20 hover:scale-105 transition-all text-white -mt-1 -mr-1"
                            onClick={togglePlay}
                            disabled={loading || !audioUrl}
                        >
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : isPlaying ? (
                                <Pause className="h-6 w-6 fill-current" />
                            ) : (
                                <Play className="h-6 w-6 fill-current ml-0.5" />
                            )}
                        </Button>
                    </div>

                    {/* Progress Bar & Time */}
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/50 w-8 text-right font-mono">{formatTime(currentTime)}</span>
                        <div className="flex-1 h-3 flex items-center group/slider">
                            <Slider
                                value={[currentTime]}
                                max={duration || 100}
                                step={1}
                                onValueChange={handleSeek}
                                className="cursor-pointer"
                                disabled={!audioUrl}
                            />
                        </div>
                        <span className="text-[10px] text-white/50 w-8 font-mono">{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            {/* Audio Element */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={onLoadedMetadata}
                    onEnded={onEnded}
                    onError={() => {
                        setIsPlaying(false);
                        setError("播放出错");
                    }}
                />
            )}

            {error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl">
                    <p className="text-sm text-red-400 font-medium px-4 py-2 border border-red-500/30 rounded bg-red-950/50">{error}</p>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Provider } from "@/components/provider-selector";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PlayerProps {
  id: string;
  provider: Provider;
  coverUrl: string;
  songInfo: {
    name: string;
    artist: string[];
    album: string;
  };
}

export function Player({ id, provider, coverUrl, songInfo }: PlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

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
        const res = await fetch("/api/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, id }),
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch song URL");
        }
        
        const data = await res.json();
        if (mounted) {
          if (data.url) {
            setAudioUrl(data.url);
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

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
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

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (audioRef.current) {
       audioRef.current.volume = newVolume;
       setVolume(newVolume);
       if (newVolume === 0) setIsMuted(true);
       else if (isMuted) setIsMuted(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl bg-zinc-900 border border-white/10 group">
      {/* Background Blur Effect */}
      <div 
        className="absolute inset-0 opacity-40 bg-cover bg-center blur-2xl transform scale-125 transition-all duration-700 ease-in-out group-hover:scale-110 group-hover:opacity-50"
        style={{ backgroundImage: `url(${coverUrl || "/placeholder.png"})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

      <div className="relative p-6 flex flex-col gap-6 text-white z-10">
        
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={coverUrl || "/placeholder.png"} 
              alt="专辑封面" 
              className={`w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl shadow-2xl ring-1 ring-white/10 transition-transform duration-500 ease-out ${isPlaying ? 'scale-105' : 'scale-100'}`}
            />
            <div className={`absolute inset-0 rounded-xl bg-black/20 transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-20'}`} />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <h3 className="font-bold text-2xl truncate tracking-tight" title={songInfo.name}>
              {songInfo.name}
            </h3>
            <div className="flex flex-col text-white/70">
              <p className="text-sm font-medium truncate" title={songInfo.artist.join(" / ")}>
                {songInfo.artist.join(" / ")}
              </p>
              <p className="text-xs text-white/50 truncate mt-0.5" title={songInfo.album}>
                {songInfo.album}
              </p>
            </div>
          </div>
        </div>

      {audioUrl&&<div className="space-y-4">
           {/* Audio Element (Hidden) */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onEnded}
            onError={() => {
                setIsPlaying(false);
                setError("播放出错");
            }}
          />

          {/* Progress Bar */}
          <div className="space-y-1.5 group/slider">
             <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="cursor-pointer [&>.relative>.absolute]:bg-white [&>.relative]:bg-white/20"
                disabled={!audioUrl}
             />
             <div className="flex justify-between text-xs font-medium text-white/50 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
             </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
              
              <div className="flex items-center gap-2 w-28 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                      onClick={toggleMute}
                  >
                      {isMuted || volume === 0 ? <VolumeX className="h-4 w-4"/> : <Volume2 className="h-4 w-4"/>}
                  </Button>
                  <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="[&>.relative>.absolute]:bg-white/80 [&>.relative]:bg-white/20"
                  />
               </div>

              <div className="flex items-center gap-4">
                  <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                      disabled={loading || !audioUrl}
                      onClick={() => {
                          if (audioRef.current) {
                               audioRef.current.currentTime -= 10;
                          }
                      }}
                  >
                      <span className="text-xs font-bold">-10s</span>
                  </Button>

                  <Button
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 shrink-0 rounded-full border-none bg-white text-black hover:bg-white/90 hover:scale-105 transition-all shadow-lg shadow-white/10"
                      onClick={togglePlay}
                      disabled={loading || !audioUrl}
                  >
                      {loading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                      ) : isPlaying ? (
                          <Pause className="h-6 w-6 ml-0.5 fill-current" />
                      ) : (
                          <Play className="h-6 w-6 ml-1 fill-current" />
                      )}
                  </Button>

                   <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                      disabled={loading || !audioUrl}
                      onClick={() => {
                           if (audioRef.current) {
                               audioRef.current.currentTime += 10;
                          }
                      }}
                  >
                       <span className="text-xs font-bold">+10s</span>
                  </Button>
              </div>

               <div className="w-28 flex justify-end">
                   {/* Placeholder for future buttons like Loop or Playlist */}
               </div>
          </div>
          
          {error && <p className="text-xs text-red-400 text-center bg-red-500/10 py-1 rounded-full animate-in fade-in slide-in-from-top-1">{error}</p>}
        </div>}
      </div>
    </div>
  );
}

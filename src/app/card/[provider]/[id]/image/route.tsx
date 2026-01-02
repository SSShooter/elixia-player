import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import Meting from "@/meting/meting.js";
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const fontData = fs.readFileSync(path.join(process.cwd(), 'public/fonts/NotoSansCJKsc-Regular.otf'));

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string; id: string }> }
) {
    const { provider, id } = await params;
    const { searchParams } = new URL(request.url);
    const width = parseInt(searchParams.get('width') || '1200', 10);
    const height = 300; // Fixed height as requested

    let songInfo = {
        name: '未知歌曲',
        artist: ['未知艺术家'],
        album: '未知专辑',
    };
    let coverUrl = 'https://via.placeholder.com/150';

    try {
        const meting = new Meting(provider);
        meting.format(true);
        const result = await meting.song(id);
        const songData = JSON.parse(result);

        if (Array.isArray(songData) && songData.length > 0) {
            const info = songData[0];
            songInfo = {
                name: info.name,
                artist: info.artist,
                album: info.album,
            };

            if (info.pic_id) {
                const picResult = await meting.pic(info.pic_id, 500);
                const picData = JSON.parse(picResult);
                coverUrl = picData.url || coverUrl;
            }
        }
    } catch (e) {
        console.error('Failed to fetch song info for image:', e);
    }

    // Fixed styling constants for 300px height (approx 3.125x scale of 96px card)
    const borderRadius = 40;
    const padding = 40;
    const coverSize = 220;
    const titleSize = 60;
    const artistSize = 40;
    const albumSize = 32;
    const gap = 48; // Space between cover and text

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#18181b', // zinc-900
                        borderRadius: `${borderRadius}px`,
                        border: '2px solid rgba(255, 255, 255, 0.1)', // Thicker border for hi-res
                        overflow: 'hidden',
                        fontFamily: 'Noto Sans CJK SC',
                        position: 'relative',
                    }}
                >
                    {/* Background Image with Blur */}
                    <img
                        src={coverUrl}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.3,
                        }}
                    />
                    {/* Gradient Overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(to right, rgba(0,0,0,0.9), rgba(0,0,0,0.5))',
                        }}
                    />

                    {/* Content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            width: '100%',
                            height: '100%',
                            padding: `${padding}px`,
                        }}
                    >
                        {/* Cover Art */}
                        <img
                            src={coverUrl}
                            width={coverSize}
                            height={coverSize}
                            style={{
                                borderRadius: `${24}px`, // Scaled radius for cover
                                objectFit: 'cover',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                marginRight: `${gap}px`,
                                flexShrink: 0,
                                width: `${coverSize}px`,
                                height: `${coverSize}px`
                            }}
                        />

                        {/* Text Info */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                flex: 1,
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    color: 'white',
                                    fontSize: `${titleSize}px`,
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginBottom: '12px', // Scaled margin
                                }}
                            >
                                {songInfo.name}
                            </div>
                            <div
                                style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: `${artistSize}px`,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginBottom: '8px',

                                }}
                            >
                                {songInfo.artist.join(' / ')}
                            </div>
                            <div
                                style={{
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontSize: `${albumSize}px`,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {songInfo.album}
                            </div>
                        </div>
                        {/* External Link Icon - Scaled */}
                        <div style={{ display: 'flex', marginLeft: 'auto', color: 'rgba(255,255,255,0.3)' }}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="64"
                                height="64"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            width: width,
            height: height,
            fonts: [
                {
                    name: 'Noto Sans CJK SC',
                    data: fontData,
                    style: 'normal',
                    weight: 400,
                },
            ],
        }
    );
}

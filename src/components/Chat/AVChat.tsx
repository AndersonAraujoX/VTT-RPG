import React, { useEffect, useRef, useState } from 'react';
import { networkManager } from '../../services/network';
import { Video, VideoOff, Mic, MicOff } from 'lucide-react';

export const AVChat: React.FC = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const myVideoRef = useRef<HTMLVideoElement>(null);
    const [remoteStreams, setRemoteStreams] = useState<{ id: string, stream: MediaStream }[]>([]);

    useEffect(() => {
        // Automatically start A/V if requested
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((mediaStream) => {
                setStream(mediaStream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = mediaStream;
                }

                if (networkManager.peer) {
                    // Answer incoming calls
                    networkManager.peer.on('call', (call) => {
                        call.answer(mediaStream); // Answer with our stream
                        call.on('stream', (userStream) => {
                            setRemoteStreams(prev => {
                                if (prev.some(s => s.id === call.peer)) return prev;
                                return [...prev, { id: call.peer, stream: userStream }];
                            });
                        });
                        call.on('close', () => {
                            setRemoteStreams(prev => prev.filter(s => s.id !== call.peer));
                        });
                    });

                    // If we connect to a new peer, call them
                    networkManager.onPeerConnect = (peerId: string) => {
                        const call = networkManager.peer!.call(peerId, mediaStream);
                        if (call) {
                            call.on('stream', (userStream) => {
                                setRemoteStreams(prev => {
                                    if (prev.some(s => s.id === peerId)) return prev;
                                    return [...prev, { id: peerId, stream: userStream }];
                                });
                            });
                            call.on('close', () => {
                                setRemoteStreams(prev => prev.filter(s => s.id !== peerId));
                            });
                        }
                    };
                }
            })
            .catch(err => {
                console.error("Failed to get local stream", err);
            });

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoEnabled;
                setVideoEnabled(!videoEnabled);
            }
        }
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioEnabled;
                setAudioEnabled(!audioEnabled);
            }
        }
    };

    return (
        <div className="absolute top-4 left-64 ml-4 flex gap-2 pointer-events-auto z-40">
            {/* Local Video */}
            <div className="relative group bg-gray-900 rounded-lg overflow-hidden border border-gray-700 w-32 h-24 shadow-lg">
                <video
                    ref={myVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute bottom-0 left-0 w-full p-1 bg-black/60 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={toggleAudio} className={`p-1 rounded ${audioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}>
                        {audioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                    </button>
                    <button onClick={toggleVideo} className={`p-1 rounded ${videoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'}`}>
                        {videoEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                    </button>
                </div>
            </div>

            {/* Remote Videos */}
            {remoteStreams.map(rs => (
                <div key={rs.id} className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700 w-32 h-24 shadow-lg">
                    <video
                        autoPlay
                        playsInline
                        ref={(ref) => { if (ref) ref.srcObject = rs.stream; }}
                        className="w-full h-full object-cover"
                    />
                </div>
            ))}
        </div>
    );
};

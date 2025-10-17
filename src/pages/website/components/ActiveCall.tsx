// src/components/ActiveCall.tsx
import React from 'react';
import type { CallState } from '../../../types/webrtc.types';

interface ActiveCallProps {
    callState: CallState | null;
    contact?: any;
    isIncoming?: boolean;
    onEndCall: () => void;
    onAnswerCall?: (callType: 'voice' | 'video') => void;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
}

export const ActiveCall: React.FC<ActiveCallProps> = ({
    callState,
    contact,
    isIncoming = false,
    onEndCall,
    onAnswerCall,
    onToggleAudio,
    onToggleVideo
}) => {
    if (!callState && !isIncoming) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl mx-4 p-6">
                <div className="text-center mb-6">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        {contact?.avatar ? (
                            <img src={contact.avatar} alt="Avatar" className="w-24 h-24 rounded-2xl" />
                        ) : (
                            <span className="text-4xl text-blue-400 font-medium">
                                {contact?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-semibold text-white mb-2">
                        {isIncoming ? 'Incoming Call' : 'Calling...'}
                    </h2>
                    
                    <p className="text-gray-400 text-lg">
                        {isIncoming ? `${contact?.name} is calling you` : `Calling ${contact?.name}`}
                    </p>
                    
                    {callState?.connectionState && (
                        <p className="text-sm text-gray-500 mt-2">
                            Status: {callState.connectionState}
                        </p>
                    )}
                </div>

                {/* Video/Audio Streams */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Local Video */}
                    {callState?.localStream && (
                        <div className="bg-black rounded-lg overflow-hidden">
                            <video 
                                autoPlay 
                                muted 
                                playsInline
                                ref={video => {
                                    if (video && callState.localStream) {
                                        video.srcObject = callState.localStream;
                                    }
                                }}
                                className="w-full h-48 object-cover"
                            />
                            <div className="text-xs text-white bg-black/50 p-2">
                                You {callState.isLocalVideoMuted && '(Video muted)'}
                            </div>
                        </div>
                    )}
                    
                    {/* Remote Video */}
                    {callState?.remoteStream && (
                        <div className="bg-black rounded-lg overflow-hidden">
                            <video 
                                autoPlay 
                                playsInline
                                ref={video => {
                                    if (video && callState.remoteStream) {
                                        video.srcObject = callState.remoteStream;
                                    }
                                }}
                                className="w-full h-48 object-cover"
                            />
                            <div className="text-xs text-white bg-black/50 p-2">
                                {contact?.name || 'Remote'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Call Controls */}
                <div className="flex justify-center space-x-4">
                    {isIncoming && onAnswerCall ? (
                        <>
                            <button
                                onClick={() => onAnswerCall('voice')}
                                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onAnswerCall('video')}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onToggleAudio}
                                className={`p-4 rounded-full transition-colors ${
                                    callState?.isLocalAudioMuted 
                                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                                }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {callState?.isLocalAudioMuted ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    )}
                                </svg>
                            </button>
                            
                            <button
                                onClick={onToggleVideo}
                                className={`p-4 rounded-full transition-colors ${
                                    callState?.isLocalVideoMuted 
                                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                                }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {callState?.isLocalVideoMuted ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    )}
                                </svg>
                            </button>
                        </>
                    )}
                    
                    <button
                        onClick={onEndCall}
                        className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
export interface CallConfig {
    type: 'voice' | 'video';
    iceServers: RTCIceServer[];
}

export interface CallState {
    isConnected: boolean;
    isCallActive: boolean;
    isLocalAudioMuted: boolean;
    isLocalVideoMuted: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    connection: RTCPeerConnection | null;
    connectionState?: RTCPeerConnectionState;
    iceConnectionState?: RTCIceConnectionState;
    error?: string;
}

export interface SdpMessage {
    type: 'offer' | 'answer';
    sessionId: string;
    sdp: RTCSessionDescriptionInit;
}

export interface IceCandidateMessage {
    sessionId: string;
    candidate: RTCIceCandidateInit;
}

export interface CallSession {
    id: string;
    caller: string;
    callee: string;
    status: 'pending' | 'active' | 'ended';
    offerSdp?: string;
    answerSdp?: string;
    createdAt: number;
}

export interface CallNotification {
    sessionId: string;
    caller: string;
    callerName?: string;
    callType: 'voice' | 'video';
    timestamp: number;
}
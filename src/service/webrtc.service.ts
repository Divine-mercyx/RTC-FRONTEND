import type { CallConfig, CallState, IceCandidateMessage, SdpMessage } from "../types/webrtc.types";

export class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private isCallActive: boolean = false;
    private isLocalAudioMuted: boolean = false;
    private isLocalVideoMuted: boolean = false;
    private onStateChange: ((state: CallState) => void) | null = null;
    private onIceCandidate: ((candidate: RTCIceCandidate) => void) | null = null;
    private currentSessionId: string | null = null;
    private iceCandidatesQueue: RTCIceCandidateInit[] = [];
    private remoteDescriptionSet: boolean = false;

    private config: CallConfig;

    constructor(config: CallConfig) {
        this.config = config;
        this.initializePeerConnection();
    }

    public setSessionId(sessionId: string) {
        this.currentSessionId = sessionId;
        console.log('WebRTC session ID set:', sessionId);
    }

    public onStateChangeCallback(callback: (state: CallState) => void) {
        this.onStateChange = callback;
        this.updateState();
    }

    public onIceCandidateCallback(callback: (candidate: RTCIceCandidate) => void) {
        this.onIceCandidate = callback;
    }

    private initializePeerConnection() {
        try {
            this.peerConnection = new RTCPeerConnection({
                iceServers: this.config.iceServers
            });

            this.peerConnection.ontrack = (event) => {
                console.log('Received remote stream:', event.streams);
                if (event.streams && event.streams[0]) {
                    this.remoteStream = event.streams[0];
                    this.updateState();
                }
            };

            this.peerConnection.onconnectionstatechange = () => {
                const state = this.peerConnection?.connectionState;
                console.log('Connection state changed:', state);
                this.updateState();
                
                if (state === 'connected') {
                    this.isCallActive = true;
                    console.log('WebRTC connection established successfully');
                } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    this.isCallActive = false;
                    if (state === 'failed') {
                        console.error('WebRTC connection failed');
                        this.updateState({ error: 'Connection failed' });
                    }
                }
            };

            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Generated ICE candidate:', event.candidate);
                    if (this.onIceCandidate) {
                        this.onIceCandidate(event.candidate);
                    }
                } else {
                    console.log('ICE gathering completed');
                }
            };

            this.peerConnection.oniceconnectionstatechange = () => {
                const state = this.peerConnection?.iceConnectionState;
                console.log('ICE connection state changed:', state);
                
                if (state === 'failed') {
                    console.error('ICE connection failed');
                    this.updateState({ error: 'ICE connection failed' });
                } else if (state === 'connected' || state === 'completed') {
                    console.log('ICE connection established');
                }
            };

            this.peerConnection.onicegatheringstatechange = () => {
                console.log('ICE gathering state:', this.peerConnection?.iceGatheringState);
            };

            console.log('Peer connection initialized successfully');
            this.updateState();
        } catch (error) {
            console.error('Failed to initialize peer connection:', error);
            this.updateState({ error: 'Failed to initialize WebRTC connection' });
        }
    }

    public async getLocalStream(): Promise<MediaStream> {
        try {
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: this.config.type === 'video' ? {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 },
                    facingMode: 'user'
                } : false
            };

            console.log('Requesting user media with constraints:', constraints);
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Local stream obtained:', this.localStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
            
            // Add tracks to peer connection
            if (this.peerConnection) {
                this.localStream.getTracks().forEach(track => {
                    console.log('Adding track to peer connection:', track.kind);
                    this.peerConnection?.addTrack(track, this.localStream!);
                });
            }

            this.updateState();
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            let errorMessage = 'Failed to access camera/microphone';
            
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Camera/microphone access denied. Please allow permissions and try again.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'No camera/microphone found. Please check your devices.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage = 'Camera/microphone is already in use by another application.';
                }
            }
            
            this.updateState({ error: errorMessage });
            throw error;
        }
    }

    public async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            console.log('Creating offer...');
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: this.config.type === 'video'
            });
            
            await this.peerConnection.setLocalDescription(offer);
            console.log('Offer created and set as local description:', offer);
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            this.updateState({ error: 'Failed to create call offer' });
            throw error;
        }
    }

    public async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            console.log('Setting remote answer:', answer);
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            this.remoteDescriptionSet = true;
            console.log('Remote answer set successfully');
            
            // Process any queued ICE candidates
            await this.processQueuedIceCandidates();
        } catch (error) {
            console.error('Error setting remote answer:', error);
            this.updateState({ error: 'Failed to set remote answer' });
            throw error;
        }
    }

    public async setRemoteOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            console.log('Setting remote offer:', offer);
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            this.remoteDescriptionSet = true;
            
            console.log('Creating answer...');
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            console.log('Answer created and set as local description:', answer);
            
            // Process any queued ICE candidates
            await this.processQueuedIceCandidates();
            
            return answer;
        } catch (error) {
            console.error('Error setting remote offer:', error);
            this.updateState({ error: 'Failed to set remote offer' });
            throw error;
        }
    }

    public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        try {
            if (this.remoteDescriptionSet) {
                console.log('Adding ICE candidate immediately:', candidate);
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                console.log('Queuing ICE candidate (remote description not set yet):', candidate);
                this.iceCandidatesQueue.push(candidate);
            }
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
            // Don't throw here as ICE candidates can fail without breaking the connection
        }
    }

    private async processQueuedIceCandidates(): Promise<void> {
        console.log(`Processing ${this.iceCandidatesQueue.length} queued ICE candidates`);
        
        for (const candidate of this.iceCandidatesQueue) {
            try {
                await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('Added queued ICE candidate:', candidate);
            } catch (error) {
                console.error('Error adding queued ICE candidate:', error);
            }
        }
        
        this.iceCandidatesQueue = [];
    }

    public toggleAudio(): boolean {
        if (!this.localStream) {
            console.warn('No local stream available for audio toggle');
            return false;
        }
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            this.isLocalAudioMuted = !audioTrack.enabled;
            console.log('Audio toggled:', audioTrack.enabled ? 'enabled' : 'disabled');
            this.updateState();
            return audioTrack.enabled;
        }
        
        console.warn('No audio track found');
        return false;
    }

    public toggleVideo(): boolean {
        if (!this.localStream) {
            console.warn('No local stream available for video toggle');
            return false;
        }
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            this.isLocalVideoMuted = !videoTrack.enabled;
            console.log('Video toggled:', videoTrack.enabled ? 'enabled' : 'disabled');
            this.updateState();
            return videoTrack.enabled;
        }
        
        console.warn('No video track found');
        return false;
    }

    public async endCall() {
        console.log('Ending WebRTC call...');
        
        this.stopLocalStream();
        
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        this.isCallActive = false;
        this.remoteStream = null;
        this.isLocalAudioMuted = false;
        this.isLocalVideoMuted = false;
        this.remoteDescriptionSet = false;
        this.iceCandidatesQueue = [];
        
        console.log('WebRTC call ended and resources cleaned up');
        this.updateState();
    }

    private stopLocalStream() {
        if (this.localStream) {
            console.log('Stopping local stream tracks');
            this.localStream.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped track:', track.kind);
            });
            this.localStream = null;
        }
    }

    private updateState(additionalState: Partial<CallState> = {}) {
        if (this.onStateChange) {
            const state: CallState = {
                isConnected: this.peerConnection?.connectionState === 'connected',
                isCallActive: this.isCallActive,
                isLocalAudioMuted: this.isLocalAudioMuted,
                isLocalVideoMuted: this.isLocalVideoMuted,
                localStream: this.localStream,
                remoteStream: this.remoteStream,
                connection: this.peerConnection,
                connectionState: this.peerConnection?.connectionState || 'new',
                iceConnectionState: this.peerConnection?.iceConnectionState || 'new',
                ...additionalState
            };
            
            this.onStateChange(state);
        }
    }

    public getConnectionState(): RTCPeerConnectionState | null {
        return this.peerConnection?.connectionState || null;
    }

    public getIceConnectionState(): RTCIceConnectionState | null {
        return this.peerConnection?.iceConnectionState || null;
    }
}

export const createWebRTCService = (callType: 'voice' | 'video'): WebRTCService => {
    const config: CallConfig = {
        type: callType,
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ]
    };

    return new WebRTCService(config);
};
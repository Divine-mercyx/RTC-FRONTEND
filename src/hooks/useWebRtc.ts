// src/hooks/useWebRTC.ts
import { useState, useEffect, useCallback } from 'react';
import { CallService } from '../service/call.service';
import type { CallState } from '../types/webrtc.types';

export const useWebRTC = (callService: CallService | null) => {
    const [callState, setCallState] = useState<CallState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (callService?.webrtcService) {
            callService.webrtcService.onStateChangeCallback((state) => {
                console.log('WebRTC state changed:', state);
                setCallState(state);
                if (state.error) {
                    setError(state.error);
                }
            });
        }

        return () => {
            // Cleanup on unmount
            if (callService?.isCallActive()) {
                console.log('Cleaning up active call on unmount');
                callService.endCall().catch(console.error);
            }
        };
    }, [callService]);

    const initiateCall = useCallback(async (
        callerProfileId: string,
        calleeAddress: string,
        calleeProfileId: string,
        callType: 'voice' | 'video'
    ) => {
        if (!callService) {
            const errorMsg = 'Call service not initialized';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            console.log('Initiating call via hook...', { callerProfileId, calleeAddress, calleeProfileId, callType });
            const sessionId = await callService.initiateCall(callerProfileId, calleeAddress, calleeProfileId, callType);
            console.log('Call initiated successfully, session ID:', sessionId);
            return sessionId;
        } catch (error) {
            console.error('Failed to initiate call:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to initiate call';
            setError(errorMsg);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [callService]);

    const answerCall = useCallback(async (sessionId: string, callType: 'voice' | 'video') => {
        if (!callService) {
            const errorMsg = 'Call service not initialized';
            setError(errorMsg);
            throw new Error(errorMsg);
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            console.log('Answering call via hook...', { sessionId, callType });
            await callService.answerCall(sessionId, callType);
            console.log('Call answered successfully');
        } catch (error) {
            console.error('Failed to answer call:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to answer call';
            setError(errorMsg);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [callService]);

    const endCall = useCallback(async () => {
        if (!callService) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            console.log('Ending call via hook...');
            await callService.endCall();
            console.log('Call ended successfully');
            setCallState(null);
        } catch (error) {
            console.error('Failed to end call:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to end call';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [callService]);

    const toggleAudio = useCallback(() => {
        if (!callService?.webrtcService) {
            console.warn('WebRTC service not available for audio toggle');
            return false;
        }
        
        try {
            const result = callService.webrtcService.toggleAudio();
            console.log('Audio toggled:', result ? 'enabled' : 'disabled');
            return result;
        } catch (error) {
            console.error('Failed to toggle audio:', error);
            setError('Failed to toggle audio');
            return false;
        }
    }, [callService]);

    const toggleVideo = useCallback(() => {
        if (!callService?.webrtcService) {
            console.warn('WebRTC service not available for video toggle');
            return false;
        }
        
        try {
            const result = callService.webrtcService.toggleVideo();
            console.log('Video toggled:', result ? 'enabled' : 'disabled');
            return result;
        } catch (error) {
            console.error('Failed to toggle video:', error);
            setError('Failed to toggle video');
            return false;
        }
    }, [callService]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        callState,
        isLoading,
        error,
        initiateCall,
        answerCall,
        endCall,
        toggleAudio,
        toggleVideo,
        clearError,
        isCallActive: callService?.isCallActive() || false,
        currentSessionId: callService?.getCurrentSessionId() || null,
    };
};
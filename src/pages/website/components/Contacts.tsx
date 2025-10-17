// src/components/Contacts.tsx
import * as React from "react";
import { useState, useEffect } from "react";
import { Navbar } from "./Navbar.tsx";
import { CallModal } from "./CallModal.tsx";
import { ActiveCall } from "./ActiveCall.tsx";
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { CONTRACTS } from "../../../config/contract.ts";
import { CallService } from "../../../service/call.service.ts";
import { useWebRTC } from "../../../hooks/useWebRtc.ts";

export const Contacts: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [contacts, setContacts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [outgoingCall, setOutgoingCall] = useState<any>(null); // NEW: Track outgoing calls
    
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    
    // Initialize call service
    const [callService] = useState(() => new CallService(signAndExecuteTransaction));
    const { 
        callState, 
        isLoading: callLoading, 
        initiateCall, 
        endCall, 
        toggleAudio, 
        toggleVideo,
        currentSessionId // NEW: Get current session ID from hook
    } = useWebRTC(callService);

    // NEW: Show ActiveCall when we have an outgoing call
    useEffect(() => {
        if (currentSessionId && !incomingCall) {
            setOutgoingCall({
                sessionId: currentSessionId,
                contact: selectedContact,
                status: 'calling'
            });
        } else if (!currentSessionId) {
            setOutgoingCall(null);
        }
    }, [currentSessionId, incomingCall, selectedContact]);

    // Poll for incoming calls
    useEffect(() => {
        if (!currentAccount?.address || outgoingCall) return; // Don't poll if we have outgoing call

        const pollForIncomingCalls = async () => {
            try {
                const events = await suiClient.queryEvents({
                    query: {
                        MoveEventType: `${CONTRACTS.PACKAGE_ID}::call_session::CallInitiated`
                    },
                    limit: 10,
                    order: 'descending'
                });

                for (const event of events.data) {
                    const eventData = event.parsedJson as any;
                    
                    // Check if this call is for the current user and we haven't seen it yet
                    if (eventData.callee === currentAccount.address && 
                        event.id.txDigest !== incomingCall?.sessionId) {
                        
                        console.log('Found incoming call:', eventData);
                        
                        // Get caller profile info
                        try {
                            const callerProfile = await suiClient.getObject({
                                id: eventData.caller_profile,
                                options: { showContent: true }
                            });

                            if (callerProfile.data?.content) {
                                const profileData = (callerProfile.data.content as any).fields;
                                setIncomingCall({
                                    sessionId: event.id.txDigest,
                                    caller: {
                                        name: profileData.name,
                                        avatar: profileData.avatar,
                                        owner: eventData.caller,
                                        profileId: eventData.caller_profile
                                    },
                                });
                                break;
                            }
                        } catch (error) {
                            console.error('Error fetching caller profile:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error polling for incoming calls:', error);
            }
        };

        const intervalId = setInterval(pollForIncomingCalls, 5000);
        pollForIncomingCalls();

        return () => clearInterval(intervalId);
    }, [currentAccount?.address, suiClient, incomingCall, outgoingCall]);

    // Handle answering incoming call
    const handleAnswerCall = async (callType: 'voice' | 'video') => {
        if (!incomingCall) return;

        try {
            const callSession = await findCallSessionByParticipants(
                incomingCall.caller.owner, 
                currentAccount!.address
            );
            
            if (callSession) {
                await callService.answerCall(callSession.objectId, callType);
                setIncomingCall(null);
            } else {
                alert('Call session not found. It may have expired.');
                setIncomingCall(null);
            }
        } catch (error) {
            console.error('Failed to answer call:', error);
            alert('Failed to answer call');
            setIncomingCall(null);
        }
    };

    // Helper function to find call session by participants
    const findCallSessionByParticipants = async (caller: string, callee: string) => {
        try {
            const objects = await suiClient.getOwnedObjects({
                owner: currentAccount!.address,
                options: { showContent: true, showType: true }
            });

            const callSession = objects.data.find(obj => 
                obj.data?.type?.includes('::call_session::CallSession') &&
                (obj.data.content as any)?.fields?.caller === caller &&
                (obj.data.content as any)?.fields?.callee === callee &&
                (obj.data.content as any)?.fields?.status === '0' // STATUS_INITIATED
            );

            return callSession?.data || null;
        } catch (error) {
            console.error('Error finding call session:', error);
            return null;
        }
    };

    // Handle rejecting incoming call
    const handleRejectCall = async () => {
        if (!incomingCall) return;

        try {
            const callSession = await findCallSessionByParticipants(
                incomingCall.caller.owner, 
                currentAccount!.address
            );
            
            if (callSession) {
                await callService.endCall();
            }
            
            setIncomingCall(null);
        } catch (error) {
            console.error('Failed to reject call:', error);
            setIncomingCall(null);
        }
    };

    // Handle ending outgoing call
    const handleEndOutgoingCall = async () => {
        await endCall();
        setOutgoingCall(null);
        setSelectedContact(null);
    };

    const searchProfiles = async () => {
        if (!searchTerm.trim()) {
            setContacts([]);
            return;
        }

        try {
            setIsLoading(true);

            const events = await suiClient.queryEvents({
                query: {
                    MoveEventType: `${CONTRACTS.PACKAGE_ID}::profile::ProfileCreated`
                },
                limit: 50
            });

            const contactPromises = events.data.map(async (event) => {
                const eventData = event.parsedJson as any;
                try {
                    const profileObject = await suiClient.getObject({
                        id: eventData.object_id,
                        options: { showContent: true }
                    });

                    if (profileObject.data?.content) {
                        const profileData = (profileObject.data.content as any).fields;
                        return {
                            id: event.id.txDigest,
                            name: profileData.name, 
                            owner: eventData.owner,
                            objectId: eventData.object_id,
                            avatar: profileData.avatar,  
                            bio: profileData.bio         
                        };
                    }
                } catch (error) {
                    console.error("Error fetching profile object:", error);
                }
                return null;
            });

            const allContacts = (await Promise.all(contactPromises)).filter(Boolean);
            
            const filteredContacts = allContacts.filter(contact => 
                contact?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            setContacts(filteredContacts);

        } catch (error) {
            console.error("Error searching profiles:", error);
            setContacts([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle call initiation from modal
    const handleCallInitiated = async (callType: 'voice' | 'video') => {
        if (!selectedContact || !currentAccount) return;

        try {
            const userProfileId = await getUserProfileId();
            
            await initiateCall(
                userProfileId,
                selectedContact.owner,
                selectedContact.objectId,
                callType
            );
            
            // Modal will close automatically because isModalOpen becomes false
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to initiate call:', error);
            alert('Failed to start call: ' + (error as Error).message);
        }
    };

    const getUserProfileId = async (): Promise<string> => {
        if (!currentAccount?.address) throw new Error('No wallet connected');
        
        const objects = await suiClient.getOwnedObjects({
            owner: currentAccount.address,
            options: { showContent: true, showType: true }
        });

        const profileObject = objects.data.find(obj => 
            obj.data?.type?.includes('::profile::Profile')
        );

        if (!profileObject?.data?.objectId) {
            throw new Error('No profile found. Please create a profile first.');
        }

        return profileObject.data.objectId;
    };

    useEffect(() => {
        if (outgoingCall && callService.webrtcService && !callState?.isCallActive) {
            const checkForAnswer = async () => {
            try {
                const answer = await callService.checkForAnswer(outgoingCall.sessionId);
                if (answer) {
                console.log('Found answer from callee:', answer);
                await callService.webrtcService?.setRemoteAnswer(answer);
                }
            } catch (error) {
                console.error('Error checking for answer:', error);
            }
            };

            // Poll every 2 seconds for answer
            const intervalId = setInterval(checkForAnswer, 2000);
            checkForAnswer(); // Initial check

            return () => clearInterval(intervalId);
        }
    }, [outgoingCall, callService, callState?.isCallActive]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchProfiles();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    return (
        <div className="min-h-screen bg-gray-900 pt-14">
            <Navbar />
            
            {/* Active Call Interface - Show for BOTH incoming AND outgoing calls */}
            {(callState?.isCallActive || outgoingCall) && (
                <ActiveCall
                    callState={callState}
                    contact={outgoingCall?.contact || incomingCall?.caller}
                    isIncoming={!!incomingCall}
                    onEndCall={incomingCall ? handleRejectCall : handleEndOutgoingCall}
                    onAnswerCall={handleAnswerCall}
                    onToggleAudio={toggleAudio}
                    onToggleVideo={toggleVideo}
                />
            )}

            {/* Incoming Call Modal - Only show if we have incoming call AND no active call */}
            {incomingCall && !callState?.isCallActive && !outgoingCall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md mx-4 p-6 animate-in fade-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                                {incomingCall.caller.avatar ? (
                                    <img src={incomingCall.caller.avatar} alt="Avatar" className="w-20 h-20 rounded-2xl" />
                                ) : (
                                    <span className="text-3xl text-green-400 font-medium">
                                        {incomingCall.caller.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-semibold text-white mb-2">
                                Incoming Call
                            </h2>
                            <p className="text-gray-400 text-lg">
                                {incomingCall.caller.name} is calling you
                            </p>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={handleRejectCall}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold transition-colors"
                            >
                                Decline
                            </button>
                            <button
                                onClick={() => handleAnswerCall('voice')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold transition-colors"
                            >
                                Answer Voice
                            </button>
                            <button
                                onClick={() => handleAnswerCall('video')}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition-colors"
                            >
                                Answer Video
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Call Type Selection Modal */}
            <CallModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                contact={selectedContact || { name: '', owner: '' }}
                onCallInitiated={handleCallInitiated}
            />

            {/* Rest of your Contacts UI remains the same */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-white mb-2">Find Users</h1>
                    <p className="text-gray-400">Search for anyone with a SuiCall profile</p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Contacts List */}
                <div className="bg-gray-800/30 rounded-xl border border-gray-700/50">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <div className="text-gray-400">Searching profiles...</div>
                        </div>
                    ) : searchTerm && contacts.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-400 mb-2">No profiles found</div>
                        </div>
                    ) : !searchTerm ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-400 mb-2">Start typing to search</div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-700/30">
                            {contacts.map((contact) => (
                                <div key={contact.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                {contact.avatar ? (
                                                    <img src={contact.avatar} alt="Avatar" className="w-10 h-10 rounded-lg" />
                                                ) : (
                                                    <span className="text-blue-400 font-medium text-sm">
                                                        {contact.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{contact.name}</div>
                                                <div className="text-gray-400 text-sm max-w-md">
                                                    {contact.bio || "No bio"}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedContact(contact);
                                                setIsModalOpen(true);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-white/5 transition-colors"
                                            title="Call this user"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
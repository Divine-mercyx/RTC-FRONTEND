import * as React from "react";

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: {
        name: string;
        avatar?: string;
        owner: string;
    };
    onCallInitiated: (callType: 'voice' | 'video') => void;
}

export const CallModal: React.FC<CallModalProps> = ({ 
    isOpen, 
    onClose, 
    contact, 
    onCallInitiated 
}) => {
    if (!isOpen) return null;

    const handleCall = (callType: 'voice' | 'video') => {
        onCallInitiated(callType);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md mx-4 p-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        {contact.avatar ? (
                            <img src={contact.avatar} alt="Avatar" className="w-16 h-16 rounded-2xl" />
                        ) : (
                            <span className="text-2xl text-blue-400 font-medium">
                                {contact.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Call {contact.name}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Choose your call type
                    </p>
                </div>

                {/* Call Options */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Voice Call */}
                    <button
                        onClick={() => handleCall('voice')}
                        className="bg-blue-600 hover:bg-blue-700 border border-blue-500/30 rounded-xl p-4 text-white transition-all duration-200 hover:scale-105 group"
                    >
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/30 transition-colors">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <div className="font-medium">Voice Call</div>
                        <div className="text-blue-300 text-xs mt-1">Audio only</div>
                    </button>

                    {/* Video Call */}
                    <button
                        onClick={() => handleCall('video')}
                        className="bg-purple-600 hover:bg-purple-700 border border-purple-500/30 rounded-xl p-4 text-white transition-all duration-200 hover:scale-105 group"
                    >
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-500/30 transition-colors">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="font-medium">Video Call</div>
                        <div className="text-purple-300 text-xs mt-1">With video</div>
                    </button>
                </div>

                {/* Call Features */}
                <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-white mb-2">Call Features</h3>
                    <ul className="text-xs text-gray-400 space-y-1">
                        <li className="flex items-center">
                            <svg className="w-3 h-3 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            End-to-end encrypted
                        </li>
                        <li className="flex items-center">
                            <svg className="w-3 h-3 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Peer-to-peer connection
                        </li>
                        <li className="flex items-center">
                            <svg className="w-3 h-3 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Zero latency
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-3 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
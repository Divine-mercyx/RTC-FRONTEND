import * as React from "react";
import { useState } from "react";
import {Navbar} from "./Navbar.tsx";

export const Calls: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'missed'>('all');

    const calls = [
        { id: 1, user: "bob.sui", type: "outgoing", status: "completed", duration: "15:30", time: "2 hours ago", missed: false },
        { id: 2, user: "carol.sui", type: "incoming", status: "completed", duration: "8:12", time: "1 day ago", missed: false },
        { id: 3, user: "dave.sui", type: "incoming", status: "missed", duration: "-", time: "2 days ago", missed: true },
        { id: 4, user: "eve.sui", type: "outgoing", status: "completed", duration: "22:45", time: "3 days ago", missed: false },
    ];

    const filteredCalls = activeTab === 'missed'
        ? calls.filter(call => call.missed)
        : calls;

    return (
        <div className="min-h-screen bg-gray-900 pt-14">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-white mb-2">Call History</h1>
                    <p className="text-gray-400">Your recent voice conversations</p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-800/30 rounded-lg p-1 mb-6 w-fit">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        All Calls
                    </button>
                    <button
                        onClick={() => setActiveTab('missed')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'missed'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Missed
                    </button>
                </div>

                {/* Calls List */}
                <div className="bg-gray-800/30 rounded-xl border border-gray-700/50">
                    {filteredCalls.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-400 mb-2">No missed calls</div>
                            <div className="text-gray-500 text-sm">Calls you miss will appear here</div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-700/30">
                            {filteredCalls.map((call) => (
                                <div key={call.id} className="p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                call.missed ? 'bg-red-500/10' : 'bg-blue-500/10'
                                            }`}>
                                                <svg
                                                    className={`w-5 h-5 ${
                                                        call.missed ? 'text-red-400' :
                                                            call.type === 'incoming' ? 'text-green-400' : 'text-blue-400'
                                                    }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    {call.type === 'incoming' ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.05 5a2 2 0 012 2v.5m0 0v3a2 2 0 01-2 2h-3m3.5-7.5h-7a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2v-7a2 2 0 00-2-2z" />
                                                    )}
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{call.user}</div>
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <span className={`${
                                                        call.missed ? 'text-red-400' : 'text-gray-400'
                                                    }`}>
                                                        {call.missed ? 'Missed call' : `${call.type} • ${call.duration}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-gray-400 text-sm">{call.time}</div>
                                            {!call.missed && (
                                                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-1">
                                                    Call again
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 flex justify-center">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>Start New Call</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
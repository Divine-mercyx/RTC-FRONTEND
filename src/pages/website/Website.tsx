import * as React from "react";
import { Navbar } from "./components/Navbar.tsx";
import { Link } from "react-router-dom";

const features = [
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: "Trustless Security",
        description: "Blockchain-verified identities ensure you're always talking to the right person."
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        title: "Instant Connection",
        description: "Sui's parallel processing delivers call setup in milliseconds."
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        title: "Complete Privacy",
        description: "Your conversations never touch our servers. Pure peer-to-peer encryption."
    }
];

export const Website: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900">
            <Navbar />

            <main className="min-h-screen pt-20">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    {/* Hero Section - Much Simpler */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
                            <span className="text-blue-400 text-xs font-medium">Powered by Sui Blockchain</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-light text-white mb-6 leading-tight">
                            Private voice calls,
                            <br />
                            <span className="text-blue-400">decentralized.</span>
                        </h1>

                        <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                            Experience secure, peer-to-peer communication where you own your data and identity.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            <Link
                                to="/profile"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                            >
                                <span>Start Calling</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>

                            <button className="text-gray-400 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                                Learn more
                            </button>
                        </div>
                    </div>

                    {/* Features - Much Cleaner */}
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="group p-6 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50"
                                >
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                        <div className="text-blue-400">
                                            {feature.icon}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Simple Stats */}
                    <div className="max-w-2xl mx-auto mt-20">
                        <div className="grid grid-cols-3 gap-8 text-center">
                            <div>
                                <div className="text-2xl font-light text-white mb-1">0ms</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Audio Delay</div>
                            </div>
                            <div>
                                <div className="text-2xl font-light text-white mb-1">100%</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Encrypted</div>
                            </div>
                            <div>
                                <div className="text-2xl font-light text-white mb-1">P2P</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Network</div>
                            </div>
                        </div>
                    </div>

                    {/* Subtle CTA */}
                    <div className="max-w-2xl mx-auto mt-20 text-center">
                        <div className="p-8 rounded-xl bg-gray-800/20 border border-gray-700/30">
                            <h3 className="text-xl font-medium text-white mb-3">
                                Ready to try decentralized calls?
                            </h3>
                            <p className="text-gray-400 mb-6 text-sm">
                                Create your profile and start calling in minutes.
                            </p>
                            <Link
                                to="/profile"
                                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm"
                            >
                                <span>Get started</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { WalletConnection } from "./WalletConnection.tsx";
import {useCurrentAccount} from "@mysten/dapp-kit";

export const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const currentAccount = useCurrentAccount();


    const navItems = [
        { name: 'Home', href: '/' },
        { name: 'Profile', href: '/profile' },
        { name: 'Calls', href: '/calls' },
        { name: 'Contacts', href: '/contacts' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/60 backdrop-blur-md border-b border-gray-800/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-14">

                    {/* Logo - More Subtle */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link
                            to="/"
                            className="flex items-center space-x-2 group"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <div className="w-7 h-7 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <span className="text-blue-400 font-medium text-sm">SC</span>
                            </div>
                            <span className="text-white font-medium text-lg group-hover:text-blue-400 transition-colors duration-200">
                                SuiCall
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation - Cleaner */}
                    <div className="hidden md:block">
                        <div className="flex items-center space-x-1">
                            {currentAccount && (
                                navItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className="text-gray-400 hover:text-white px-3 py-2 rounded-lg text-sm font-normal transition-all duration-200 hover:bg-white/5"
                                        >
                                            {item.name}
                                        </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Wallet Connection - Integrated */}
                    <div className="hidden md:block">
                        <WalletConnection />
                    </div>

                    {/* Mobile menu button - Simpler */}
                    <div className="md:hidden flex items-center space-x-2">
                        <WalletConnection />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation - Cleaner */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-800/50 pt-4 pb-4">
                        <div className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className="block text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-base font-normal transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};
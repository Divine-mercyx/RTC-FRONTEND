import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import {useEffect, useState} from "react";
import { Wallet, ChevronDown, Copy, ExternalLink } from "lucide-react";
import {useSuiClient} from "@mysten/dapp-kit";

export const WalletConnection = () => {
    const currentAccount = useCurrentAccount();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const suiClient = useSuiClient();
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!currentAccount?.address) {
                setBalance(null);
                return;
            }
            try {
                setLoading(true);
                const balance = await suiClient.getBalance({
                    owner: currentAccount.address,
                });
                setBalance(Number(balance.totalBalance) / 1_000_000_000);
            } catch (err: any) {
                setError(err.message || "Failed to fetch balance");
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, [suiClient, currentAccount?.address]);

    const copyAddress = () => {
        if (currentAccount?.address) {
            navigator.clipboard.writeText(currentAccount.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (currentAccount) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="group relative flex items-center gap-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500/30 rounded-lg transition-all duration-200"
                >
                    <div className="relative flex items-center gap-2">
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-white/90 font-medium">
                                {formatAddress(currentAccount.address)}
                            </span>
                        </div>

                        <ChevronDown
                            className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                                isDropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </div>
                </button>

                {isDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-72 bg-gray-800 border border-gray-600 rounded-xl shadow-lg p-4 z-50">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                                    <Wallet className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium mb-1 text-white">Wallet Balance</p>
                                    <p className="text-xs text-gray-400">
                                        {loading && "Loading..."}
                                        {error && `Error: ${error}`}
                                        {balance !== null && !loading && !error && (
                                            <span className="text-2xl font-light text-white">{balance.toFixed(2)} SUI</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={copyAddress}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors duration-200"
                                >
                                    <Copy className="w-4 h-4 text-gray-300" />
                                    <span className="text-sm text-gray-300">
                                        {copied ? 'Copied!' : 'Copy'}
                                    </span>
                                </button>

                                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors duration-200">
                                    <ExternalLink className="w-4 h-4 text-gray-300" />
                                    <span className="text-sm text-gray-300">Explorer</span>
                                </button>
                            </div>

                            <ConnectButton
                                connectText="Disconnect"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors duration-200 text-red-300 hover:text-red-200"
                            />
                        </div>
                    </div>
                )}

                {isDropdownOpen && (
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                    />
                )}
            </div>
        );
    }

    return (
        <ConnectButton
            connectText="Connect Wallet"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        />
    );
};
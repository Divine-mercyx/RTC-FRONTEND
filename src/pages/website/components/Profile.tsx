import * as React from "react";
import { useState, useEffect } from "react";
import { Navbar } from "./Navbar.tsx";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useSuiClient } from "@mysten/dapp-kit";
import { CONTRACTS } from "../../../config/contract.ts";
import {Transaction} from "@mysten/sui/transactions";

export const Profile: React.FC = () => {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [isEditing, setIsEditing] = useState(false);
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [profile, setProfile] = useState({
        name: "",
        avatar: "",
        bio: "",
        status: "Available"
    });
    const [profileObjectId, setProfileObjectId] = useState<string | null>(null);

    // Check if user has a profile
    useEffect(() => {
        const checkProfile = async () => {
            if (!currentAccount?.address) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const objects = await suiClient.getOwnedObjects({
                    owner: currentAccount.address,
                    options: {
                        showContent: true,
                        showType: true
                    }
                });

                const profileObject = objects.data.find(obj =>
                    obj.data?.type?.includes(`${CONTRACTS.PACKAGE_ID}::profile::Profile`)
                );

                if (profileObject && profileObject.data?.content) {
                    const profileData = (profileObject.data.content as any).fields;
                    setHasProfile(true);
                    setProfileObjectId(profileObject.data.objectId);
                    setProfile({
                        name: profileData.name,
                        avatar: profileData.avatar,
                        bio: profileData.bio,
                        status: "Available"
                    });
                } else {
                    setHasProfile(false);
                }
            } catch (error) {
                console.error("Error checking profile:", error);
                setHasProfile(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkProfile();
    }, [currentAccount?.address, suiClient]);

    const handleCreateProfile = async () => {
        if (!profile.name.trim()) {
            alert("Please enter a username");
            return;
        }

        if (!currentAccount) {
            alert("Please connect your wallet first");
            return;
        }

        try {
            setIsCreating(true);

            // Create transaction
            const tx = new Transaction();

            // Convert strings to vector<u8>
            const nameBytes = Array.from(new TextEncoder().encode(profile.name));
            const avatarBytes = Array.from(new TextEncoder().encode(profile.avatar || ""));
            const bioBytes = Array.from(new TextEncoder().encode(profile.bio || ""));

            tx.moveCall({
                target: `${CONTRACTS.PACKAGE_ID}::profile::create_profile_entry`,
                arguments: [
                    tx.pure.vector('u8', nameBytes),
                    tx.pure.vector('u8', avatarBytes),
                    tx.pure.vector('u8', bioBytes),
                ],
            });

            // Sign and execute transaction
            await signAndExecuteTransaction({
                transaction: tx,
            }, {
                onSuccess: (result) => {
                    console.log("✅ Profile created successfully:", result);
                    setHasProfile(true);
                    setIsEditing(false);
                    alert("Profile created successfully!");

                    // Refresh the page after a short delay to see the new profile
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                },
                onError: (error) => {
                    console.error("❌ Failed to create profile:", error);
                    alert(`Failed to create profile: ${error.message}`);
                },
            });

        } catch (error: any) {
            console.error("❌ Error in create profile:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!profileObjectId) {
            alert("No profile found to update");
            return;
        }

        if (!currentAccount) {
            alert("Please connect your wallet first");
            return;
        }

        try {
            setIsUpdating(true);

            // Convert strings to vector<u8> for the contract
            const nameBytes = Array.from(new TextEncoder().encode(profile.name));
            const avatarBytes = Array.from(new TextEncoder().encode(profile.avatar || ""));
            const bioBytes = Array.from(new TextEncoder().encode(profile.bio || ""));

            const tx = new Transaction();

            const profileObject = tx.object(profileObjectId);

            tx.moveCall({
                target: `${CONTRACTS.PACKAGE_ID}::profile::update_profile`,
                arguments: [
                    tx.object(profileObjectId), // Use tx.object() directly
                    tx.pure.vector('u8', nameBytes),
                    tx.pure.vector('u8', avatarBytes),
                    tx.pure.vector('u8', bioBytes),
                ],
            });

            await signAndExecuteTransaction({
                transaction: tx,
            }, {
                onSuccess: (result) => {
                    console.log("✅ Profile updated successfully:", result);
                    setIsEditing(false);
                    alert("Profile updated successfully!");
                },
                onError: (error) => {
                    console.error("❌ Failed to update profile:", error);
                    alert(`Failed to update profile: ${error.message}`);
                },
            });

        } catch (error: any) {
            console.error("❌ Error updating profile:", error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSave = () => {
        if (hasProfile) {
            handleUpdateProfile();
        } else {
            handleCreateProfile();
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 pt-14">
                <Navbar />
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Checking profile...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No wallet connected
    if (!currentAccount) {
        return (
            <div className="min-h-screen bg-gray-900 pt-14">
                <Navbar />
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-medium text-white mb-2">Connect Your Wallet</h2>
                        <p className="text-gray-400 mb-6">Please connect your wallet to view or create your profile</p>
                    </div>
                </div>
            </div>
        );
    }

    // No profile exists - show creation form
    if (!hasProfile) {
        return (
            <div className="min-h-screen bg-gray-900 pt-14">
                <Navbar />
                <div className="max-w-2xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-light text-white mb-2">Create Your Profile</h1>
                        <p className="text-gray-400">Set up your decentralized identity to start making calls</p>
                    </div>

                    {/* Profile Creation Card */}
                    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-8">
                        <div className="space-y-6">
                            {/* Avatar Preview */}
                            <div className="text-center">
                                <div className="w-24 h-24 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                    {profile.avatar ? (
                                        <img src={profile.avatar} alt="Avatar" className="w-24 h-24 rounded-2xl" />
                                    ) : (
                                        <span className="text-3xl text-blue-400 font-medium">
                                            {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400">Profile preview</p>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your username (e.g., alice.sui)"
                                    value={profile.name}
                                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <p className="text-xs text-gray-500 mt-2">This will be your unique identity on SuiCall</p>
                            </div>

                            {/* Avatar URL (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">
                                    Avatar URL (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/avatar.jpg"
                                    value={profile.avatar}
                                    onChange={(e) => setProfile({...profile, avatar: e.target.value})}
                                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-3">
                                    Bio (Optional)
                                </label>
                                <textarea
                                    placeholder="Tell others about yourself..."
                                    value={profile.bio}
                                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                                    rows={4}
                                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                                />
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleCreateProfile}
                                disabled={!profile.name.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-medium transition-colors duration-200"
                            >
                                {isCreating ? "Creating..." : "Create Profile"}
                            </button>

                            <p className="text-xs text-gray-500 text-center">
                                Your profile will be stored as an NFT on the Sui blockchain
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Profile exists - show profile view with edit option
    return (
        <div className="min-h-screen bg-gray-900 pt-14">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-light text-white mb-2">Profile</h1>
                    <p className="text-gray-400">Manage your decentralized identity</p>
                </div>

                {/* Profile Card */}
                <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6 mb-8">
                    <div className="flex items-start space-x-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-center">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Avatar" className="w-20 h-20 rounded-xl" />
                                ) : (
                                    <span className="text-2xl text-blue-400 font-medium">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                                            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Avatar URL
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.avatar}
                                            onChange={(e) => setProfile({...profile, avatar: e.target.value})}
                                            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            value={profile.bio}
                                            onChange={(e) => setProfile({...profile, bio: e.target.value})}
                                            rows={3}
                                            className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                                        />
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleSave}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-medium text-white">{profile.name}</h2>
                                            <p className="text-gray-400 mt-1">{profile.bio || "No bio yet"}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                        >
                                            Edit Profile
                                        </button>
                                    </div>

                                    <div className="flex items-center space-x-6 text-sm">
                                        <div>
                                            <span className="text-gray-400">Status: </span>
                                            <span className="text-green-400">{profile.status}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Wallet: </span>
                                            <span className="text-white text-xs font-mono">
                                                {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4 text-center">
                        <div className="text-2xl font-light text-white mb-1">0</div>
                        <div className="text-gray-400 text-sm">Calls Made</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4 text-center">
                        <div className="text-2xl font-light text-white mb-1">0</div>
                        <div className="text-gray-400 text-sm">Contacts</div>
                    </div>
                    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4 text-center">
                        <div className="text-2xl font-light text-white mb-1">0m</div>
                        <div className="text-gray-400 text-sm">Total Call Time</div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Getting Started</h3>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3 py-2">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <span className="text-blue-400 text-sm">1</span>
                            </div>
                            <div>
                                <span className="text-white text-sm">Profile created successfully!</span>
                                <div className="text-gray-500 text-xs">You're ready to start making calls</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 py-2">
                            <div className="w-8 h-8 bg-gray-500/10 rounded-lg flex items-center justify-center">
                                <span className="text-gray-400 text-sm">2</span>
                            </div>
                            <div>
                                <span className="text-gray-400 text-sm">Make your first call</span>
                                <div className="text-gray-500 text-xs">Visit the Calls page to get started</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
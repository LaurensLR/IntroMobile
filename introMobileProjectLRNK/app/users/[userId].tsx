import {router, useLocalSearchParams} from "expo-router";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Pressable} from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import { getInitials} from "@/app/(tabs)/profile";
import Header from "@/app/components/header";
import { followUser, unfollowUser} from "@/src/lib/follows";
import { useAuth } from "@/src/hooks/useAuth";
import { useFollows } from "@/src/hooks/useFollows";

const User = () => {
    const params = useLocalSearchParams();
    const rawUserId = params.userId;
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    const [currentUserData, setCurrentUserData] = useState<any>(null);
    const { user: currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const isOwnProfile =
        !!currentUser?.uid && currentUser.uid === userId;
    const { followersCount, followingCount } = useFollows(userId);

    useEffect(() => {
        if (!currentUser?.uid) return;

        const ref = doc(FIRESTORE_DB, "users", currentUser.uid);

        const unsubscribe = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                setCurrentUserData(snap.data());
            }
        });

        return () => unsubscribe();
    }, [currentUser?.uid]);

    useEffect(() => {
        if (!userId) return;

        const ref = doc(FIRESTORE_DB, "users", userId);

        const unsubscribe = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                setProfileUser(snap.data());
            } else {
                setProfileUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    useEffect(() => {
        if (!currentUser?.uid || !userId) return;

        const ref = doc(
            FIRESTORE_DB,
            "users",
            currentUser.uid,
            "following",
            userId
        );

        const unsubscribe = onSnapshot(ref, (snap) => {
            setIsFollowing(snap.exists());
        });

        return () => unsubscribe();
    }, [currentUser?.uid, userId]);

    const handleFollow = async () => {
        if (!currentUser?.uid || !userId || !profileUser) return;

        if (isFollowing) {
            await unfollowUser(currentUser.uid, userId);
        } else {
            await followUser(
                currentUser.uid,
                userId,
                currentUserData?.username,
                profileUser?.username
            );
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!profileUser) {
        return (
            <View style={{ flex: 1 }}>
                <Header title="Profiel" />

                <View style={styles.center}>
                    <Text>User niet gevonden</Text>
                </View>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <Header title="Profiel" />

            <View style={{ padding: 20 }}>
                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {getInitials(profileUser.username || "Speler")}
                        </Text>
                    </View>

                    <View>
                        <Text style={styles.name}>
                            {profileUser.username || "Speler"}
                        </Text>
                        <Text style={styles.location}>
                            Speelt padel
                        </Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text>Wedstrijden</Text>
                    </View>

                    <Pressable
                        style={styles.stat}
                        onPress={() =>
                            router.push({
                                pathname: "/follows",
                                params: {
                                    tab: "followers",
                                    rawUserId
                                },
                            })
                        }
                    >
                        <Text style={styles.statNumber}>{followersCount}</Text>
                        <Text>Volgers</Text>
                    </Pressable>

                    <Pressable
                        style={styles.stat}
                        onPress={() =>
                            router.push({
                                pathname: "/follows",
                                params: {
                                    tab: "following",
                                    rawUserId
                                },
                            })
                        }
                    >
                        <Text style={styles.statNumber}>{followingCount}</Text>
                        <Text>Volgend</Text>
                    </Pressable>
                </View>

                <View style={styles.buttons}>
                    {!isOwnProfile && (
                        <Pressable
                            style={styles.followBtn}
                            onPress={handleFollow}
                        >
                            <Text style={{ color: "white", fontWeight: "bold" }}>
                                {isFollowing ? "Volgend" : "Volgen"}
                            </Text>
                        </Pressable>
                    )}

                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa"
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 60,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: "#f5f6fa"
    },

    headerTitle: {
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
        color: "#0f2a3d"
    },

    side: {
        width: 40,
        alignItems: "flex-start"
    },
    icon: {
        fontSize: 24,
        color: "#0f2a3d",
        width: 30,
        textAlign: "center"
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center"
    },

    profileRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20
    },

    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#0f2a3d",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16
    },

    avatarText: {
        color: "white",
        fontSize: 24,
        fontWeight: "bold"
    },

    name: {
        fontSize: 20,
        fontWeight: "bold"
    },

    location: {
        color: "#666",
        marginTop: 4
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 20
    },

    stat: {
        alignItems: "center"
    },

    statNumber: {
        fontSize: 18,
        fontWeight: "bold"
    },

    buttons: {
        flexDirection: "row",
        gap: 10
    },

    followBtn: {
        flex: 1,
        backgroundColor: "#345fff",
        padding: 12,
        borderRadius: 20,
        alignItems: "center"
    },

    messageBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#345fff",
        padding: 12,
        borderRadius: 20,
        alignItems: "center"
    }
});

export default User;
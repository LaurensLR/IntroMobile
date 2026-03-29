import {router, useLocalSearchParams} from "expo-router";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator, Pressable} from "react-native";
import { doc, getDoc} from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import { getInitials} from "@/app/(tabs)/profile";
import Header from "@/app/components/header";
import { followUser, unfollowUser} from "@/app/lib/follows";
import { useAuth } from "@/app/hooks/useAuth";
import { useFollows } from "@/app/hooks/useFollows";



const User = () => {
    const params = useLocalSearchParams();
    const rawUserId = params.userId;
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const { followersCount, followingCount } = useFollows(userId);

    const handleMessage = () => {
        router.push({
            pathname: "/",
            params: { chatId: userId }
        });
    };

    const handleFollow = async () => {
        if (!currentUser?.uid || !userId || !profileUser) return;

        if (isFollowing) {
            await unfollowUser(currentUser.uid, userId);
            setIsFollowing(false);
        } else {
            await followUser(
                currentUser.uid,
                userId,
                profileUser.username
            );
            setIsFollowing(true);
        }
    };

    useEffect(() => {
        if (!userId) return;

        const fetchUser = async () => {
            try {
                const ref = doc(FIRESTORE_DB, "users", userId);
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    setProfileUser(snap.data());
                }
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    useEffect(() => {
        if (!currentUser?.uid || !userId) return;

        const checkFollow = async () => {
            const ref = doc(
                FIRESTORE_DB,
                "users",
                currentUser.uid,
                "following",
                userId
            );
            const snap = await getDoc(ref);
            setIsFollowing(snap.exists());
        };

        checkFollow();
    }, [currentUser, userId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!profileUser) {
        return (
            <View style={styles.center}>
                <Text>User niet gevonden</Text>
            </View>
        );
    }

    console.log("USER:", profileUser);
    return (
        <View style={styles.container}>
            <Header title="Profiel" />
            <View style={{padding: 20}}>

                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {getInitials(profileUser.username)}
                        </Text>
                    </View>

                    <View>
                        <Text style={styles.name}>{profileUser.username}</Text>
                        <Text style={styles.location}>
                            Speelt padel
                        </Text>
                    </View>
                </View>

                {/* STATS */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>0</Text>
                        <Text>Wedstrijden</Text>
                    </View>

                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>{followersCount}</Text>
                        <Text>Volgers</Text>
                    </View>

                    <View style={styles.stat}>
                        <Text style={styles.statNumber}>{followingCount}</Text>
                        <Text>Volgend</Text>
                    </View>
                </View>

                <View style={styles.buttons}>

                    <Pressable
                        style={({ pressed }) => [
                            styles.followBtn,
                            pressed && { opacity: 0.7 }
                        ]}
                        onPress={handleFollow}
                    >
                        <Text style={{ color: "white" }}>
                            {isFollowing ? "Volgend" : "Volgen"}
                        </Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.messageBtn,
                            pressed && { opacity: 0.7 }
                        ]}
                        onPress={handleMessage}
                    >
                        <Text style={{ color: "#345fff" }}>Bericht</Text>
                    </Pressable>

                </View>
            </View>


        </View>
    );
}

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
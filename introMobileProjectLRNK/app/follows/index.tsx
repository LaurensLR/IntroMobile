import React, {useEffect, useState} from "react";
import {FlatList, StyleSheet, Text, View} from "react-native";
import {collection, doc, getDoc, onSnapshot} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";
import {useLocalSearchParams} from "expo-router";
import Header from "@/app/components/header";
import UserCard from "@/app/components/UserCard";

type UserItem = {
    id: string;
    username?: string;
    level?: string;
};

const Follows = () => {
    const params = useLocalSearchParams<{ tab?: string }>();
    const userId = getAuth().currentUser?.uid;
    const [followers, setFollowers] = useState<UserItem[]>([]);
    const [following, setFollowing] = useState<UserItem[]>([]);
    const [activeTab, setActiveTab] = useState<"followers" | "following">(
        params.tab === "following" ? "following" : "followers"
    );

    useEffect(() => {
        if (!userId) return;

        const followersRef = collection(FIRESTORE_DB, "users", userId, "followers");
        const followingRef = collection(FIRESTORE_DB, "users", userId, "following");

        const fetchUsers = async (ids: string[]) => {
            return await Promise.all(
                ids.map(async (id) => {
                    const snap = await getDoc(doc(FIRESTORE_DB, "users", id));
                    return {
                        id,
                        ...(snap.data() || {}),
                    };
                })
            );
        };

        const unsubFollowers = onSnapshot(followersRef, (snap) => {
            const ids = snap.docs.map(doc => doc.id);

            fetchUsers(ids).then((users) => {
                setFollowers(users);
            });
        });

        const unsubFollowing = onSnapshot(followingRef, (snap) => {
            const ids = snap.docs.map(doc => doc.id);

            fetchUsers(ids).then((users) => {
                setFollowing(users);
            });
        });

        return () => {
            unsubFollowers();
            unsubFollowing();
        };
    }, [userId]);

    const data = activeTab === "followers" ? followers : following;

    return (
        <View style={styles.container}>
            <Header title="" />

            {/* Tabs */}
            <View style={styles.tabs}>
                <Text
                    style={[styles.tab, activeTab === "followers" && styles.activeTab]}
                    onPress={() => setActiveTab("followers")}
                >
                    Volgers
                </Text>
                <Text
                    style={[styles.tab, activeTab === "following" && styles.activeTab]}
                    onPress={() => setActiveTab("following")}
                >
                    Volgend
                </Text>
            </View>

            {/* List */}
            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <UserCard
                        id={item.id}
                        username={item.username || "Speler"}
                        level={item.level}
                    />
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 20 }}>
                        Geen gebruikers
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    tabs: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 16,
        gap: 20,
    },
    tab: {
        fontSize: 16,
        color: "#888",
    },
    activeTab: {
        fontWeight: "bold",
        color: "#000",
    },
    item: {
        padding: 12,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },
});

export default Follows;
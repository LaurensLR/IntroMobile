import React, {useEffect, useState} from "react";
import {ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {FIREBASE_AUTH, FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";
import {getAuth, onAuthStateChanged, signOut, User} from "firebase/auth";
import {collection, doc, getDoc, onSnapshot, query, updateDoc, where} from "firebase/firestore";
import {router} from "expo-router";
import {FontAwesome} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import {useFollows} from "@/app/hooks/useFollows";
//import { seeding } from "@/app/firebase/seedClubs"

type Sport = "tennis" | "padel";
type Level = "beginner" | "intermediate" | "pro";

const SPORTS: Sport[] = ["tennis", "padel"];
const LEVELS: Level[] = ["beginner", "intermediate", "pro"];

const auth = getAuth();



export const getInitials = (name: string) =>
    name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase();

const Index = () => {
    if (!auth.currentUser) {
        Alert.alert("Fout", "Je moet ingelogd zijn");
        return;
    }
    const userId = auth.currentUser.uid
    const [username, setUsername] = useState<string>("");
    const [sport, setSport] = useState<Sport | null>(null);
    const [level, setLevel] = useState<Level | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isFirstSetup, setIsFirstSetup] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { followersCount, followingCount } = useFollows(userId);
    const [matches, setMatches] = useState<number>(0);
    const stats = {
        matches: matches,
        followers: followersCount,
        following: followingCount
    };

    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(FIRESTORE_DB, "users", userId, "notifications"),
            where("read", "==", false)
        );

        return onSnapshot(q, (snapshot) => {
            setUnreadCount(snapshot.size);
        });
    }, [userId]);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(FIRESTORE_DB, "matches"),
            where("createdBy", "==", user.uid)
        );

        return onSnapshot(q, (snap) => {
            setMatches(snap.size);
        });
    }, [user]);

    useEffect(() => {
        return onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
            setUser(currentUser);
            // Reset state voor elke gebruikerswissel
            setUsername("");
            setSport(null);
            setLevel(null);

            if (!currentUser) {
                setLoading(false);
                return;
            }

            setLoading(true);
            getDoc(doc(FIRESTORE_DB, "users", currentUser.uid)).then((snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    setUsername(data.username ?? "");
                    setSport(data.sport ?? null);
                    setLevel(data.level ?? null);
                    setIsFirstSetup(!data.sport && !data.level);
                }
            }).finally(() => setLoading(false));
        });
    }, []);

    const save = async () => {
        if (!user) return;
        if (!sport || !level) {
            Alert.alert("Verplicht", "Kies een sport en een niveau om verder te gaan.");
            return;
        }
        setSaving(true);
        try {
            await updateDoc(doc(FIRESTORE_DB, "users", user.uid), { sport, level });
            if (isFirstSetup) {
                setIsFirstSetup(false);
                router.replace("/");
            } else {
                Alert.alert("Opgeslagen", "Je voorkeuren zijn bijgewerkt.");
            }
        } catch (e) {
            Alert.alert("Fout", "Kon voorkeuren niet opslaan.");
            console.log(e);
        } finally {
            setSaving(false);
        }
    };

    const logout = async () => {
        await signOut(FIREBASE_AUTH);
        router.replace("/Login/Login");
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#345fff" />
            </View>
        );
    }

    if (isFirstSetup) {
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.title}>Welkom, {username}!</Text>
                    <Text style={styles.subtitle}>Stel je voorkeuren in om te beginnen.</Text>

                    <Text style={styles.sectionLabel}>Kies je sport</Text>
                    <View style={styles.optionRow}>
                        {SPORTS.map((s) => (
                            <Pressable
                                key={s}
                                onPress={() => setSport(s)}
                                style={[styles.optionBtn, sport === s && styles.optionBtnActive]}
                            >
                                <Text style={[styles.optionText, sport === s && styles.optionTextActive]}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.sectionLabel}>Kies je niveau</Text>
                    <View style={styles.optionRow}>
                        {LEVELS.map((l) => (
                            <Pressable
                                key={l}
                                onPress={() => setLevel(l)}
                                style={[styles.optionBtn, level === l && styles.optionBtnActive]}
                            >
                                <Text style={[styles.optionText, level === l && styles.optionTextActive]}>
                                    {l.charAt(0).toUpperCase() + l.slice(1)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {saving ? (
                        <ActivityIndicator size="large" color="#345fff" style={{ marginTop: 24 }} />
                    ) : (
                        <Pressable
                            onPress={save}
                            style={[styles.saveBtn, (!sport || !level) && styles.saveBtnDisabled]}
                        >
                            <Text style={styles.saveBtnText}>Aan de slag</Text>
                        </Pressable>
                    )}
                </ScrollView>
            </SafeAreaView>

        );
    }

    const Stat = ({ label, value }: { label: string; value: number }) => (
        <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                {value}
            </Text>
            <Text style={{ color: "#666", fontSize: 12 }}>
                {label}
            </Text>
        </View>
    );

    return (
        <View style={{ flex: 1 }}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profiel</Text>

                <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ position: "relative" }}>
                        <Pressable
                            onPress={() => router.push("/notifications/notificationScreen")}
                            style={({ pressed }) => [
                                { padding: 8 },
                                pressed && { opacity: 0.6 }
                            ]}
                        >
                            <FontAwesome name="bell" size={22} color="white" />
                        </Pressable>

                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Pressable
                        onPress={() => router.push("/profile/profileSettings")}
                        style={({ pressed }) => [
                            { padding: 8 },
                            pressed && { opacity: 0.6 }
                        ]}
                    >
                        <FontAwesome name="bars" size={22} color="white" />
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container}>

                {/* PROFILE */}
                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {getInitials(username)}
                        </Text>
                    </View>

                    <View>
                        <Text style={styles.name}>{username}</Text>
                    </View>
                </View>

                {/* STATS */}
                <View style={styles.statsRow}>
                    <Stat label="Wedstrijden" value={stats.matches} />
                    <View style={styles.divider} />
                    <Stat label="Volgers" value={stats.followers} />
                    <View style={styles.divider} />
                    <Stat label="Volgend" value={stats.following} />
                </View>

                {/* SPORT */}
                <Text style={styles.sectionLabel}>Sport</Text>
                <View style={styles.optionRow}>
                    {SPORTS.map((s) => (
                        <Pressable
                            key={s}
                            onPress={() => setSport(s)}
                            style={[styles.optionBtn, sport === s && styles.optionBtnActive]}
                        >
                            <Text style={[styles.optionText, sport === s && styles.optionTextActive]}>
                                {s}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* LEVEL */}
                <Text style={styles.sectionLabel}>Niveau</Text>
                <View style={styles.optionRow}>
                    {LEVELS.map((l) => (
                        <Pressable
                            key={l}
                            onPress={() => setLevel(l)}
                            style={[styles.optionBtn, level === l && styles.optionBtnActive]}
                        >
                            <Text style={[styles.optionText, level === l && styles.optionTextActive]}>
                                {l}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* SAVE */}
                {saving ? (
                    <ActivityIndicator size="large" color="#345fff" style={{ marginTop: 24 }} />
                ) : (
                    <Pressable onPress={save} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Opslaan</Text>
                    </Pressable>
                )}

                {/* LOGOUT */}
                <Pressable onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutBtnText}>Uitloggen</Text>
                </Pressable>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#345fff",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: "#666",
        marginBottom: 32,
    },
    header: {
        backgroundColor: "#335fff",
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    headerTitle: {
        color: "white",
        fontSize: 22,
        fontWeight: "bold"
    },

    container: {
        padding: 24,
        backgroundColor: "#f5f6fa"
    },

    profileRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 20
    },

    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#0f2a3d",
        justifyContent: "center",
        alignItems: "center"
    },
    avatarText: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold"
    },

    name: {
        fontSize: 20,
        fontWeight: "bold"
    },

    link: {
        color: "#345fff",
        marginTop: 4
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30
    },

    divider: {
        width: 1,
        height: 30,
        backgroundColor: "#ddd"
    },

    sectionLabel: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 10,
        color: "#333",
    },

    optionRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 28,
    },

    optionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#ccc",
        alignItems: "center",
        backgroundColor: "#fff"
    },

    optionBtnActive: {
        backgroundColor: "#0f2a3d",
        borderColor: "#0f2a3d"
    },

    optionText: {
        color: "#555",
        fontWeight: "600"
    },

    optionTextActive: {
        color: "#fff"
    },

    saveBtn: {
        backgroundColor: "#cbff00",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10
    },
    saveBtnDisabled: {
        opacity: 0.4,
    },

    saveBtnText: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#222",
    },

    logoutBtn: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ff4444",
        alignItems: "center",
    },

    logoutBtnText: {
        color: "#ff4444",
        fontWeight: "bold"
    },

    badge: {
        position: "absolute",
        top: 2,
        right: 2,
        backgroundColor: "red",
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 3
    },

    badgeText: {
        color: "white",
        fontSize: 10,
        fontWeight: "bold"
    }
});

export default Index;
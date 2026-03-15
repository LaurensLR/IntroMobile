import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB } from "@/app/firebase/firebaseConfig";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { router } from "expo-router";
import { seeding } from "@/app/firebase/seedClubs"

type Sport = "tennis" | "padel";
type Level = "beginner" | "intermediate" | "pro";

const SPORTS: Sport[] = ["tennis", "padel"];
const LEVELS: Level[] = ["beginner", "intermediate", "pro"];

const Profile = () => {
    const [username, setUsername] = useState<string>("");
    const [sport, setSport] = useState<Sport | null>(null);
    const [level, setLevel] = useState<Level | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [isFirstSetup, setIsFirstSetup] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
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
        return unsubscribe;
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
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.name}>{username}</Text>

            <Text style={styles.sectionLabel}>Sport</Text>
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

            <Text style={styles.sectionLabel}>Niveau</Text>
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
                <Pressable onPress={save} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Opslaan</Text>
                </Pressable>
            )}

            <Pressable onPress={logout} style={styles.logoutBtn}>
                <Text style={styles.logoutBtnText}>Uitloggen</Text>
            </Pressable>

            <Pressable onPress={seeding} style={styles.logoutBtn}>
                <Text> Seed Firestore </Text>
            </Pressable>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        padding: 24,
        paddingTop: 40,
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#345fff",
        marginBottom: 32,
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
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#ccc",
        alignItems: "center",
    },
    optionBtnActive: {
        borderColor: "#345fff",
        backgroundColor: "#345fff",
    },
    optionText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#555",
    },
    optionTextActive: {
        color: "#fff",
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
    saveBtn: {
        backgroundColor: "#cbff00",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
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
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#ff4444",
        alignItems: "center",
    },
    logoutBtnText: {
        color: "#ff4444",
        fontWeight: "bold",
        fontSize: 16,
    },
});

export default Profile;
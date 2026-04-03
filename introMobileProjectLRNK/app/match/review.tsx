import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import {addDoc, collection, doc, getDoc, getDocs, runTransaction, Timestamp} from "firebase/firestore";
import { router, useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import Header from "@/app/components/header";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";

type MatchPlayer = {
    id: string;
    name: string;
    rank?: number;
};

type MatchItem = {
    id: string;
    clubId: string;
    clubName: string;
    fieldName?: string;
    start: Timestamp;
    end: Timestamp;
    players?: MatchPlayer[];
    participants?: string[];
    teams?: {
        team1?: string[];
        team2?: string[];
    };
    status: "open" | "full" | "finished";
    pricePerPlayer?: number;
};

type UserProfile = {
    username?: string;
};

const asString = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

const formatDate = (timestamp: Timestamp) =>
    timestamp.toDate().toLocaleDateString("nl-BE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

const formatTimeRange = (start: Timestamp, end: Timestamp) => {
    const startTime = start.toDate().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
    const endTime = end.toDate().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
    return `${startTime} - ${endTime}`;
};

const ReviewMatchJoin = () => {
    const params = useLocalSearchParams();
    const matchId = asString(params.matchId);
    const teamKeyRaw = asString(params.teamKey);
    const slotIndexRaw = Number(asString(params.slotIndex));

    const teamKey = teamKeyRaw === "team1" || teamKeyRaw === "team2" ? teamKeyRaw : null;
    const slotIndex = slotIndexRaw === 0 || slotIndexRaw === 1 ? (slotIndexRaw as 0 | 1) : null;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [match, setMatch] = useState<MatchItem | null>(null);
    const [usersById, setUsersById] = useState<Record<string, UserProfile>>({});

    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        const fetchData = async () => {
            if (!matchId || !teamKey || slotIndex === null) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const [matchSnap, usersSnapshot] = await Promise.all([
                    getDoc(doc(FIRESTORE_DB, "matches", matchId)),
                    getDocs(collection(FIRESTORE_DB, "users")),
                ]);

                if (!matchSnap.exists()) {
                    setMatch(null);
                    return;
                }

                setMatch({
                    id: matchSnap.id,
                    ...(matchSnap.data() as Omit<MatchItem, "id">),
                });

                const userMap: Record<string, UserProfile> = {};
                usersSnapshot.docs.forEach((userDoc) => {
                    userMap[userDoc.id] = userDoc.data() as UserProfile;
                });
                setUsersById(userMap);
            } catch (error) {
                console.log("Error loading join payment:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [matchId, teamKey, slotIndex]);

    const confirmJoin = async () => {
        if (!matchId || !teamKey || slotIndex === null || !currentUser || !match) {
            Alert.alert("Fout", "Ongeldige matchgegevens.");
            return;
        }

        setSubmitting(true);

        try {
            const userSnap = await getDoc(doc(FIRESTORE_DB, "users", currentUser.uid));
            const username = userSnap.data()?.username || "Speler";

            await runTransaction(FIRESTORE_DB, async (transaction) => {
                const ref = doc(FIRESTORE_DB, "matches", matchId);
                const snap = await transaction.get(ref);

                if (!snap.exists()) throw new Error("match_not_found");

                const latest = snap.data() as Omit<MatchItem, "id">;

                const latestPlayers = [...(latest.players || [])];
                const latestTeam1 = [...(latest.teams?.team1 || [])];
                const latestTeam2 = [...(latest.teams?.team2 || [])];
                const latestParticipants = [...(latest.participants || [])];

                if (latest.status !== "open") throw new Error("match_closed");

                const alreadyInPlayers = latestPlayers.some(p => p.id === currentUser.uid);
                const alreadyInTeams =
                    latestTeam1.includes(currentUser.uid) ||
                    latestTeam2.includes(currentUser.uid);

                if (alreadyInPlayers || alreadyInTeams) {
                    throw new Error("already_registered");
                }

                const targetTeam = teamKey === "team1" ? latestTeam1 : latestTeam2;

                if (targetTeam[slotIndex]) throw new Error("slot_taken");

                if (slotIndex === 1 && !targetTeam[0]) throw new Error("slot_order");

                targetTeam[slotIndex] = currentUser.uid;

                latestPlayers.push({
                    id: currentUser.uid,
                    name: username,
                    rank: 1.5,
                });

                // 👇 NIEUW (voorkom duplicates)
                if (!latestParticipants.includes(currentUser.uid)) {
                    latestParticipants.push(currentUser.uid);
                }

                const filledSpots = [...latestTeam1, ...latestTeam2].filter(Boolean).length;

                transaction.update(ref, {
                    teams: {
                        team1: latestTeam1,
                        team2: latestTeam2,
                    },
                    players: latestPlayers,
                    participants: latestParticipants, // 👈 BELANGRIJK
                    status: filledSpots >= 4 ? "full" : "open",
                });
            });

            await addDoc(
                collection(FIRESTORE_DB, "matches", matchId, "messages"),
                {
                    type: "system",
                    text: `${username} heeft de chat gejoined`,
                    createdAt: Timestamp.now(),
                }
            );

            router.replace({
                pathname: "/confirmation",
                params: {
                    title: "Match gejoined!",
                    subtitle: "Je bent succesvol toegevoegd aan de match.",
                    matchId,
                },
            });

        } catch (error: any) {
            const code = error?.message;
            if (code === "already_registered") {
                Alert.alert("Al ingeschreven", "Je bent al geregistreerd voor deze match.");
            } else if (code === "slot_order") {
                Alert.alert("Niet beschikbaar", "Vul eerst de eerste plek van dit team.");
            } else if (code === "slot_taken") {
                Alert.alert("Niet beschikbaar", "Deze plek is intussen gevuld.");
            } else if (code === "match_closed") {
                Alert.alert("Niet beschikbaar", "Deze match is niet meer open.");
            } else {
                Alert.alert("Fout", "Betaling of inschrijving is niet gelukt. Probeer opnieuw.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="Betaling" />
                <ActivityIndicator size="large" color="#0984e3" style={{ marginTop: 30 }} />
            </View>
        );
    }

    if (!match || !teamKey || slotIndex === null) {
        return (
            <View style={styles.container}>
                <Header title="Betaling" />
                <Text style={styles.errorText}>Match of plek niet gevonden.</Text>
            </View>
        );
    }

    if (!currentUser) {
        return (
            <View style={styles.container}>
                <Header title="Betaling" />
                <Text style={styles.errorText}>Je moet ingelogd zijn om te betalen.</Text>
            </View>
        );
    }

    const price = match.pricePerPlayer ?? 12;
    const slotLabel = teamKey === "team1" ? `Team A - plek ${slotIndex + 1}` : `Team B - plek ${slotIndex + 1}`;

    return (
        <View style={styles.container}>
            <Header title="Jouw inschrijving" />

            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.label}>Club</Text>
                    <Text style={styles.value}>{match.clubName}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Veld</Text>
                    <Text style={styles.value}>{match.fieldName || "Onbekend veld"}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Datum</Text>
                    <Text style={styles.value}>{formatDate(match.start)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Tijd</Text>
                    <Text style={styles.value}>{formatTimeRange(match.start, match.end)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Plek</Text>
                    <Text style={styles.value}>{slotLabel}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.priceLabel}>Prijs</Text>
                    <Text style={styles.price}>EUR {price}</Text>
                </View>

                <Text style={styles.info}>Bevestig je betaling om je plek te reserveren</Text>

                <Pressable
                    style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }, submitting && { opacity: 0.6 }]}
                    onPress={confirmJoin}
                    disabled={submitting}
                >
                    <Text style={styles.buttonText}>{submitting ? "Verwerken..." : "Betalen"}</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa",
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        color: "#7f8c8d",
    },
    value: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2c3e50",
        maxWidth: "65%",
        textAlign: "right",
    },
    divider: {
        height: 1,
        backgroundColor: "#ecf0f1",
        marginVertical: 15,
    },
    priceLabel: {
        fontSize: 18,
        fontWeight: "600",
        color: "#2c3e50",
    },
    price: {
        fontSize: 20,
        fontWeight: "700",
        color: "#27ae60",
    },
    info: {
        fontSize: 14,
        color: "#7f8c8d",
        textAlign: "center",
        marginVertical: 15,
    },
    button: {
        backgroundColor: "#0984e3",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    errorText: {
        fontSize: 15,
        color: "#7f8c8d",
        textAlign: "center",
        marginTop: 24,
    },
});

export default ReviewMatchJoin;

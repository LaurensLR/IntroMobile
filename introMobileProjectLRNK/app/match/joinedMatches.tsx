{/* Gebruiker kan de wedstrijden zien die hij/zij zelf heeft gemaakt of zich
*   aan heeft geregistreerd */}

import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from "react-native";
import { collection, doc, getDocs, query, where, writeBatch, Timestamp } from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import { getAuth } from "firebase/auth";
import { router, useFocusEffect } from "expo-router";
import { formatDate, formatStatus, formatTime, getStatusColor } from "../(tabs)/home";
import Header from "@/app/components/header";

type Match = {
    id: string;
    clubName: string;
    fieldName: string;
    start: Timestamp;
    end: Timestamp;
    status: string;
    createdBy?: string;
    teams?: {
        team1?: string[];
        team2?: string[];
    };
};

const Matches = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    const auth = getAuth();
    const user = auth.currentUser;

    useFocusEffect(
        useCallback(() => {
            if (!user) {
                setMatches([]);
                setLoading(false);
                return;
            }

            const fetchMatches = async () => {
                try {
                    setLoading(true);

                    const createdByQuery = query(
                        collection(FIRESTORE_DB, "matches"),
                        where("createdBy", "==", user.uid)
                    );

                    const team1Query = query(
                        collection(FIRESTORE_DB, "matches"),
                        where("teams.team1", "array-contains", user.uid)
                    );

                    const team2Query = query(
                        collection(FIRESTORE_DB, "matches"),
                        where("teams.team2", "array-contains", user.uid)
                    );

                    const [createdBySnapshot, team1Snapshot, team2Snapshot] = await Promise.all([
                        getDocs(createdByQuery),
                        getDocs(team1Query),
                        getDocs(team2Query),
                    ]);

                    const allDocs = [
                        ...createdBySnapshot.docs,
                        ...team1Snapshot.docs,
                        ...team2Snapshot.docs,
                    ];

                    const uniqueMatches = Array.from(
                        new Map(
                            allDocs.map((matchDoc) => [
                                matchDoc.id,
                                {
                                    id: matchDoc.id,
                                    ...(matchDoc.data() as Omit<Match, "id">),
                                },
                            ])
                        ).values()
                    );

                    const now = Date.now();
                    const batch = writeBatch(FIRESTORE_DB);
                    let hasStatusUpdates = false;

                    uniqueMatches.forEach((match) => {
                        const team1Count = (match.teams?.team1 || []).filter(Boolean).length;
                        const team2Count = (match.teams?.team2 || []).filter(Boolean).length;
                        const filledSpots = team1Count + team2Count;

                        const shouldBeFinished = match.end.toDate().getTime() < now;
                        const shouldBeFull = !shouldBeFinished && filledSpots >= 4;
                        const nextStatus = shouldBeFinished ? "finished" : shouldBeFull ? "full" : "open";

                        if (match.status !== nextStatus) {
                            batch.update(doc(FIRESTORE_DB, "matches", match.id), { status: nextStatus });
                            match.status = nextStatus;
                            hasStatusUpdates = true;
                        }
                    });

                    if (hasStatusUpdates) {
                        await batch.commit();
                    }

                    const sorted = uniqueMatches.sort(
                        (a, b) => b.start.toDate().getTime() - a.start.toDate().getTime()
                    );

                    setMatches(sorted);
                } catch (error) {
                    console.error("Error fetching matches:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchMatches();
        }, [user])
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#345fff" />
            </View>
        );
    }

    if (matches.length === 0) {
        return (
            <View style={styles.center}>
                <Text>Geen matches gevonden</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <Header title="Jouw wedstrijden" />

            <FlatList
                data={matches}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const color = getStatusColor(item.status);

                    return (
                        <Pressable
                            style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
                            onPress={() =>
                                router.push({
                                    pathname: "/match/[matchId]",
                                    params: { matchId: item.id },
                                } as any)
                            }
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.club}>{item.clubName}</Text>
                            </View>

                            <Text style={styles.field}>{item.fieldName || "Onbekend veld"}</Text>

                            <Text style={styles.date}>
                                {formatDate(item.start)} • {formatTime(item.start)} - {formatTime(item.end)}
                            </Text>

                            <View style={[styles.statusBadge, { backgroundColor: color + "20" }]}>
                                <Text style={[styles.statusText, { color }]}>{formatStatus(item.status)}</Text>
                            </View>
                        </Pressable>
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f5f6fa",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 14,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    club: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111",
    },
    field: {
        fontSize: 14,
        color: "#555",
        marginTop: 4,
    },
    date: {
        marginTop: 6,
        fontSize: 13,
        color: "#888",
    },
    statusBadge: {
        marginTop: 10,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
});

export default Matches;

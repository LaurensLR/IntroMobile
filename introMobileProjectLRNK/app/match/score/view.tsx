import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import Header from "@/app/components/header";

const ScoreView = () => {
    const params = useLocalSearchParams();
    const matchId = params.matchId as string;

    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState<any>(null);

    useEffect(() => {
        const fetchScore = async () => {
            try {
                const snap = await getDoc(doc(FIRESTORE_DB, "matches", matchId));

                if (snap.exists()) {
                    const data = snap.data();
                    setScore(data.score);
                }
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        };

        fetchScore();
    }, [matchId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!score) {
        return (
            <View style={styles.center}>
                <Text>Geen score beschikbaar</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Wedstrijd score" />

            <View style={styles.content}>
                {/* WINNAAR */}
                <Text style={styles.winner}>
                    Winnaar: {score.winner === "team1" ? "Team A" : "Team B"}
                </Text>

                {/* SETS */}
                {score.sets.map((set: any, index: number) => (
                    <Text key={index} style={styles.set}>
                        Set {index + 1}: {set.team1} - {set.team2}
                    </Text>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff"
    },
    content: {
        padding: 20
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    winner: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16
    },
    set: {
        fontSize: 16,
        marginBottom: 8
    },
    rankingBox: {
        marginTop: 20,
        padding: 12,
        backgroundColor: "#f5f6fa",
        borderRadius: 10
    },
    rankingTitle: {
        fontWeight: "bold",
        marginBottom: 6
    }
});
export default ScoreView;
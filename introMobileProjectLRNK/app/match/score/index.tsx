import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import Header from "@/app/components/header";
import {calculateDelta, getWinner, InputSet, SetScore} from "@/src/lib/ranking";
import {doc, getDoc, updateDoc} from "firebase/firestore";
import {FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";
import {router, useLocalSearchParams} from "expo-router";


const MatchScoreScreen = ()=>  {
    const params = useLocalSearchParams();
    const matchId = params.matchId as string;
    const [sets, setSets] = useState<InputSet[]>([
        { team1: "", team2: "" },
        { team1: "", team2: "" },
        { team1: "", team2: "" },
    ]);

    const handleSubmit = async () => {
        const parsedSetsArray: SetScore[] = sets
            .filter((s) => s.team1 !== "" && s.team2 !== "")
            .map((s) => [Number(s.team1), Number(s.team2)]);

        const parsedSetsFirestore = sets
            .filter((s) => s.team1 !== "" && s.team2 !== "")
            .map((s) => ({
                team1: Number(s.team1),
                team2: Number(s.team2),
            }));

        const winner = getWinner(parsedSetsArray);

        if (!winner) {
            Alert.alert("Ongeldige score");
            return;
        }

        try {
            const matchRef = doc(FIRESTORE_DB, "matches", matchId);
            const matchSnap = await getDoc(matchRef);

            if (!matchSnap.exists()) {
                Alert.alert("Match niet gevonden");
                return;
            }

            const matchData = matchSnap.data();

            await updateDoc(matchRef, {
                score: {
                    sets: parsedSetsFirestore,
                    winner,
                },
                status: "finished",
            });

            const team1: string[] = matchData.teams?.team1 || [];
            const team2: string[] = matchData.teams?.team2 || [];

            const getUserLevel = async (userId: string) => {
                const ref = doc(FIRESTORE_DB, "users", userId);
                const snap = await getDoc(ref);
                return snap.exists() ? Number(snap.data().level ?? 1.5) : 1.5;
            };

            const team1Levels = await Promise.all(team1.map(getUserLevel));
            const team2Levels = await Promise.all(team2.map(getUserLevel));

            const updatePlayer = async (
                userId: string,
                playerLevel: number,
                opponents: number[],
                didWin: boolean
            ) => {
                const delta = calculateDelta(
                    playerLevel,
                    opponents[0] ?? 1.5,
                    opponents[1] ?? 1.5,
                    didWin
                );

                const newLevel = Math.max(1, Number((playerLevel + delta).toFixed(2)));

                await updateDoc(doc(FIRESTORE_DB, "users", userId), {
                    level: newLevel
                });
            };

            await Promise.all(
                team1.map((userId, i) =>
                    updatePlayer(userId, team1Levels[i], team2Levels, winner === "team1")
                )
            );

            await Promise.all(
                team2.map((userId, i) =>
                    updatePlayer(userId, team2Levels[i], team1Levels, winner === "team2")
                )
            );

            Alert.alert("Score opgeslagen!");
            router.replace({
                pathname: "/match/score/view",
                params: { matchId }
            });

        } catch (error) {
            console.log(error);
            Alert.alert("Fout bij opslaan");
        }
    };

    return (
        <View style={styles.container}>
            <Header title="" />
            <View style={{ padding: 20, }}>
                <Text style={styles.title}>Wedstrijd is afgelopen</Text>
                <Text style={styles.subtitle}>Geef de sets in (best of 3)</Text>

                {sets.map((set, index) => (
                    <View key={index} style={styles.setRow}>
                        <Text style={styles.setLabel}>Set {index + 1}</Text>

                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="6"
                            value={set.team1}
                            onChangeText={(text) => {
                                const newSets = [...sets];
                                newSets[index].team1 = text;
                                setSets(newSets);
                            }}
                        />

                        <Text style={styles.dash}>-</Text>

                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="4"
                            value={set.team2}
                            onChangeText={(text) => {
                                const newSets = [...sets];
                                newSets[index].team2 = text;
                                setSets(newSets);
                            }}
                        />
                    </View>
                ))}

                <Pressable style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Opslaan</Text>
                </Pressable>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 5,
    },
    subtitle: {
        marginBottom: 20,
        color: "#666",
    },
    setRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
        gap: 10,
    },
    setLabel: {
        width: 50,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        width: 50,
        padding: 8,
        textAlign: "center",
        borderRadius: 6,
    },
    dash: {
        fontSize: 16,
    },
    button: {
        marginTop: 20,
        backgroundColor: "#2ecc71",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
});

export default MatchScoreScreen;
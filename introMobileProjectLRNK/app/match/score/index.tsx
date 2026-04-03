import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import Header from "@/app/components/header";
import {getWinner, InputSet, SetScore} from "@/src/lib/ranking";


const MatchScoreScreen = ()=>  {
    const [sets, setSets] = useState<InputSet[]>([
        { team1: "", team2: "" },
        { team1: "", team2: "" },
        { team1: "", team2: "" },
    ]);

    const handleSubmit = () => {
        const parsedSets: SetScore[] = sets
            .filter((s) => s.team1 !== "" && s.team2 !== "")
            .map((s) => [Number(s.team1), Number(s.team2)]);

        const winner = getWinner(parsedSets);

        if (!winner) {
            Alert.alert("Ongeldige score");
            return;
        }

        console.log("Winner:", winner);
        console.log("Sets:", parsedSets);

        // 👉 hier Firestore save later
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
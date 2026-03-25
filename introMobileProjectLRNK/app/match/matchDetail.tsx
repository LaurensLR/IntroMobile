import React from "react";
import {View, StyleSheet, Text, Pressable, TouchableOpacity, Alert} from "react-native";
import {router} from "expo-router";
import {addDoc, collection, Timestamp} from "firebase/firestore";
import {FIRESTORE_DB} from "@/app/firebase/firebaseConfig";
import { getAuth } from "firebase/auth";
import { useLocalSearchParams } from "expo-router";
import {MONTHS} from "@/app/clubs/[clubId]";


type player = {
    id: string;
    name: string;
    rank: number;
};

type Match = {
    clubId: string,
    clubName: string,
    fieldId: string,
    fieldName: string,
    start: Timestamp,
    end: Timestamp,

    matchType: "competitive" | "friendly",
    gender: "all" | "men" | "women" | "mixed",

    levelRange: {
        min: number,
        max: number,
    };

    players: player[],

    teams: {
        team1: string[],
        team2: string[],
    };

    score?: {
        sets: [number, number][],
    };

    status: "open" | "full" | "finished",
    createdAt: Timestamp,
};
const MatchDetail = () => {
    const {
        clubId,
        clubName,
        fieldId,
        fieldName,
        date,
        time,
        matchType,
        gender,
    } = useLocalSearchParams();

    const auth = getAuth();
    const user = auth.currentUser;

    const parseToDate = (dateStr: string, timeStr: string) => {
        const [dayStr, monthStr] = dateStr.split(" ");
        const [hours, minutes] = timeStr.split(":").map(Number);

        const day = Number(dayStr);
        const monthIndex = MONTHS.indexOf(monthStr.toLowerCase());
        const year = new Date().getFullYear();

        if (day <= 0 || monthIndex === -1) return null;

        return new Date(year, monthIndex, day, hours, minutes, 0);
    };

    const startDate = parseToDate(date as string, time as string);

    if (!startDate) {
        return (
            <View style={styles.screen}>
                <Text>Ongeldige datum</Text>
            </View>
        );
    }

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 90);

    const bookMatch = async () => {
        if (!user) {
            Alert.alert("Je moet ingelogd zijn");
            return;
        }

        const matchData: Match = {
            clubId: clubId as string,
            clubName: clubName as string,
            fieldId: fieldId as string,
            fieldName: fieldName as string,

            start: Timestamp.fromDate(startDate),
            end: Timestamp.fromDate(endDate),

            matchType:
                matchType === "competitive" ? "competitive" : "friendly",

            gender:
                gender === "men" ||
                gender === "women" ||
                gender === "mixed"
                    ? gender
                    : "all",

            levelRange: {
                min: 0.25,
                max: 0.5,
            },

            players: [
                {
                    id: user.uid,
                    name: user.displayName || "Speler",
                    rank: 1,
                },
            ],

            teams: {
                team1: [user.uid],
                team2: [],
            },

            status: "open",
            createdAt: Timestamp.now(),
        };

        try {
            await addDoc(collection(FIRESTORE_DB, "matches"), matchData);

            console.log("Match opgeslagen");
            router.push("/match/MatchConfirmation");

        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <View style={styles.screen}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Wedstrijd</Text>
            </View>

            {/* CONTENT */}
            <View style={styles.card}>
                <Text style={styles.title}>Wedstrijd details</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>Club</Text>
                    <Text style={styles.value}>{clubName}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Veld</Text>
                    <Text style={styles.value}>{fieldName}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Datum</Text>
                    <Text style={styles.value}>
                        {startDate.toLocaleDateString("nl-BE")}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Tijd</Text>
                    <Text style={styles.value}>
                        {startDate.toLocaleTimeString("nl-BE", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })} -{" "}
                        {endDate.toLocaleTimeString("nl-BE", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Type</Text>
                    <Text style={styles.value}>{matchType}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Gender</Text>
                    <Text style={styles.value}>{gender}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Prijs</Text>
                    <Text style={styles.price}>€12 p.p.</Text>
                </View>

                <Pressable style={styles.button} onPress={bookMatch}>
                    <Text style={styles.buttonText}>Betalen</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#345fff",
    },

    /* HEADER */
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        justifyContent: "center",
        alignItems: "center",
    },

    headerTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },

    /* CARD */
    card: {
        flex: 1,
        backgroundColor: "#f5f6fa",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
    },

    title: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 20,
        color: "#2c3e50",
    },

    /* INFO */
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    label: {
        color: "#7f8c8d",
        fontSize: 14,
    },

    value: {
        fontSize: 15,
        fontWeight: "600",
        color: "#2c3e50",
    },

    divider: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 20,
    },

    /* PRICE */
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },

    priceLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#2c3e50",
    },

    price: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0984e3",
    },

    /* BUTTON */
    button: {
        backgroundColor: "#0984e3",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    closeBtn: {
        position: "absolute",
        left: 20,
        top: 60,
    },

    closeText: {
        fontSize: 22,
        color: "#2c3e50",
    },
});

export default MatchDetail;
{/* Gebruiker ziet een overzicht van alle gekozen opties en kan de wedstrijd boeken*/}

import React from "react";
import {View, StyleSheet, Text, Alert, Pressable} from "react-native";
import {router} from "expo-router";
import {addDoc, collection, getDocs, query, Timestamp, where} from "firebase/firestore";
import {FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";
import { useLocalSearchParams } from "expo-router";
import {MONTHS} from "@/app/clubs/[clubId]";
import Header from "@/app/components/header";
import {createNotification} from "@/src/lib/notifications";
import {getAuth} from "firebase/auth";

type player = {
    id: string;
    name: string;
    rank: number;
};

export type Match = {
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

    participants: string[],

    teams: {
        team1: string[],
        team2: string[],
    };

    score?: {
        sets: [number, number][],
    };

    status: "open" | "full" | "finished",
    createdAt: Timestamp,
    createdBy: string,
};

const auth = getAuth();

const Review = () => {
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

    const asString = (value: string | string[] | undefined) =>
        Array.isArray(value) ? value[0] : value;

    const clubIdValue = asString(clubId);
    const clubNameValue = asString(clubName);
    const fieldIdValue = asString(fieldId);
    const fieldNameValue = asString(fieldName);
    const dateValue = asString(date);
    const timeValue = asString(time);
    const matchTypeValue = asString(matchType);
    const genderValue = asString(gender);

    const user = auth.currentUser;
    if (!user) {
        Alert.alert("Je moet ingelogd zijn");
        return;
    }
    const userId = auth.currentUser.uid;

    const parseToDate = (dateStr: string, timeStr: string) => {
        const [hours, minutes] = timeStr.split(":").map(Number);

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split("-").map(Number);
            return new Date(year, month - 1, day, hours, minutes, 0);
        }

        const [dayStr, monthStr] = dateStr.split(" ");

        const day = Number(dayStr);
        const monthIndex = MONTHS.indexOf(monthStr.toLowerCase().replace(".", ""));
        const year = new Date().getFullYear();

        if (day <= 0 || monthIndex === -1) return null;

        return new Date(year, monthIndex, day, hours, minutes, 0);
    };

    if (!clubIdValue || !fieldIdValue || !clubNameValue || !fieldNameValue || !dateValue || !timeValue) {
        return (
            <View style={styles.screen}>
                <Text>Ongeldige matchgegevens</Text>
            </View>
        );
    }

    const startDate = parseToDate(dateValue, timeValue);

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

        const bookingsQuery = query(
            collection(FIRESTORE_DB, "bookings"),
            where("clubId", "==", clubIdValue),
            where("fieldId", "==", fieldIdValue),
            where("status", "==", "confirmed"),
        );

        const matchesQuery = query(
            collection(FIRESTORE_DB, "matches"),
            where("clubId", "==", clubIdValue),
            where("fieldId", "==", fieldIdValue),
        );

        const [bookingsSnapshot, matchesSnapshot] = await Promise.all([
            getDocs(bookingsQuery),
            getDocs(matchesQuery),
        ]);

        const hasBookingConflict = bookingsSnapshot.docs.some((doc) => {
            const data = doc.data();
            const existingStart = data.start?.toDate?.();
            const existingEnd = data.end?.toDate?.();
            if (!existingStart || !existingEnd) return false;
            return startDate < existingEnd && endDate > existingStart;
        });

        const hasMatchConflict = matchesSnapshot.docs.some((doc) => {
            const data = doc.data();
            if (data.status === "finished") return false;
            const existingStart = data.start?.toDate?.();
            const existingEnd = data.end?.toDate?.();
            if (!existingStart || !existingEnd) return false;
            return startDate < existingEnd && endDate > existingStart;
        });

        if (hasBookingConflict || hasMatchConflict) {
            Alert.alert("Niet beschikbaar", "Dit veld en tijdstip is al gereserveerd. Kies een ander tijdstip.");
            return;
        }

        const matchData: Match = {
            clubId: clubIdValue,
            clubName: clubNameValue,
            fieldId: fieldIdValue,
            fieldName: fieldNameValue,

            start: Timestamp.fromDate(startDate),
            end: Timestamp.fromDate(endDate),

            matchType:
                matchTypeValue === "competitive" ? "competitive" : "friendly",

            gender:
                genderValue === "men" ||
                genderValue === "women" ||
                genderValue === "mixed"
                    ? genderValue
                    : "all",

            levelRange: {
                min: 1.0,
                max: 2.0,
            },

            players: [
                {
                    id: user.uid,
                    name: user.displayName || "Speler",
                    rank: 1.5,
                },
            ],

            participants: [user.uid],

            teams: {
                team1: [userId],
                team2: [],
            },

            score: {
                sets: [],
            },

            status: "open",
            createdAt: Timestamp.now(),
            createdBy: user.uid
        };

        try {
            const docRef = await addDoc(collection(FIRESTORE_DB, "matches"), matchData);

            const matchId = docRef.id;

            await createNotification({
                userId,
                title: "Wedstrijd aangemaakt!",
                body: "Je match staat nu online.",
                data: {
                    matchId: matchId
                }
            });

            router.push({
                pathname: "/confirmation",
                params: {
                    title: "Wedstrijd bevestigd!",
                    subtitle: "Je wedstrijd is succesvol gereserveerd.",
                    redirect: "/(tabs)/home",
                },
            });

        } catch (error) {
            console.error("Error:", error);
            Alert.alert("Fout", "Er ging iets mis bij het aanmaken van de match.");
        }
    };

    return (
        <View style={styles.screen}>

            <Header title="Nieuw wedstrijd" />
            <View style={styles.card}>
                <Text style={styles.title}>Wedstrijd details</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>Club</Text>
                    <Text style={styles.value}>{clubNameValue}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Veld</Text>
                    <Text style={styles.value}>{fieldNameValue}</Text>
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
                    <Text style={styles.value}>{matchTypeValue}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Gender</Text>
                    <Text style={styles.value}>{genderValue}</Text>
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
        color: "#fff",
    },
});

export default Review;
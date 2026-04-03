import React, {useCallback, useState} from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable,} from "react-native";
import {collection, doc, getDocs, query, updateDoc, where} from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import { getAuth } from "firebase/auth";
import {router, useFocusEffect} from "expo-router";
import {Booking, formatDate, formatStatus, formatTime, getStatusColor} from "../(tabs)/home";
import Header from "@/app/components/header";


const Bookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const auth = getAuth();
    const user = auth.currentUser;

    useFocusEffect(
        useCallback(() => {
            if (!user) return;

            const fetchBookings = async () => {
                try {
                    setLoading(true);

                    const q = query(
                        collection(FIRESTORE_DB, "bookings"),
                        where("userId", "==", user.uid)
                    );

                    const snapshot = await getDocs(q);
                    const now = new Date();

                    const data = await Promise.all(
                        snapshot.docs.map(async (docSnap) => {
                            const booking = {
                                id: docSnap.id,
                                ...(docSnap.data() as Omit<Booking, "id">),
                            };

                            const end = booking.end.toDate();

                            if (end < now && booking.status === "confirmed") {
                                await updateDoc(doc(FIRESTORE_DB, "bookings", booking.id), {
                                    status: "completed"
                                });

                                return {
                                    ...booking,
                                    status: "completed"
                                };
                            }

                            return booking;
                        })
                    );

                    data.sort((a, b) =>
                        b.start.toDate().getTime() - a.start.toDate().getTime()
                    );

                    setBookings(data);

                } catch (error) {
                    console.error("Error fetching bookings:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchBookings();

        }, [user])
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#345fff" />
            </View>
        );
    }

    if (bookings.length === 0) {
        return (
            <View style={styles.center}>
                <Text>Geen boekingen gevonden</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f6fa" }}>
            {/* HEADER */}
            <Header title="Jouw reservaties" />

            <FlatList
                data={bookings}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const color = getStatusColor(item.status);

                    return (
                        <Pressable
                            style={({ pressed }) => [
                                styles.card,
                                pressed && { opacity: 0.8 }
                            ]}
                            onPress={() => router.push({
                                pathname: "/booking/[booking]",
                                params: { booking: item.id }
                            })}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.club}>{item.club_name}</Text>
                                <Text style={styles.price}>€{item.price}</Text>
                            </View>

                            <Text style={styles.field}>{item.field_name}</Text>

                            <Text style={styles.date}>
                                {formatDate(item.start)} • {formatTime(item.start)}
                            </Text>

                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: color + "20" }
                            ]}>
                                <Text style={[styles.statusText, { color }]}>
                                    {formatStatus(item.status)}
                                </Text>
                            </View>
                        </Pressable>
                    );
                }}
            />
        </View>
    );
};


const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },

    close: {
        fontSize: 22,
        fontWeight: "600",
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
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

    price: {
        fontSize: 15,
        fontWeight: "700",
        color: "#345fff",
    },

    statusBadge: {
        marginTop: 10,
        alignSelf: "flex-start",
        backgroundColor: "#e8f5e9",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },

    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#27ae60",
    },
});

export default Bookings;
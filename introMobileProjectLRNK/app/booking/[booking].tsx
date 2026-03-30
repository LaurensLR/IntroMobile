import {useLocalSearchParams} from "expo-router";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, Alert, ActivityIndicator, Pressable } from "react-native";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {formatDate, formatTime, formatStatus} from "@/app/(tabs)/home";
import Header from "@/app/components/header";
import {createNotification} from "@/src/lib/notifications";
import {getAuth} from "firebase/auth";

const auth = getAuth();

const BookingPage = () => {
    const { booking } = useLocalSearchParams<{ booking: string }>();
    const [bookingData, setBookingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    if (!auth.currentUser) {
        Alert.alert("Fout", "Je moet ingelogd zijn");
        return;
    }
    const userId = auth.currentUser.uid

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const ref = doc(FIRESTORE_DB, "bookings", booking);
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    setBookingData({ id: snap.id, ...snap.data() });
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (booking) fetchBooking();
    }, [booking]);

    const cancelBooking = async () => {
        Alert.alert(
            "Boeking annuleren",
            "Ben je zeker dat je deze boeking wil annuleren?",
            [
                { text: "Nee" },
                {
                    text: "Ja",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const ref = doc(FIRESTORE_DB, "bookings", booking);

                            await updateDoc(ref, {
                                status: "cancelled"
                            });

                            setBookingData((prev: any) => ({
                                ...prev,
                                status: "cancelled"
                            }));

                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
            ]
        );
        await createNotification({
            userId,
            title: "Boeking geannuleerd!",
            body: `Je boeking werd geannuleerd`,
            data: {
                bookingId: booking
            }
        });
    };

    if (loading) {
        return <ActivityIndicator size="large" />;
    }

    if (!bookingData) {
        return <Text>Boeking niet gevonden</Text>;
    }

    const canCancel =
        bookingData.status === "confirmed" &&
        bookingData.start.toDate() > new Date();

    return (
        <View style={styles.container}>
            <Header title="Jouw reservatie" />
            <View style={{ padding: 20 }}>
                <View style={styles.card}>
                    <Text style={styles.club}>{bookingData.club_name}</Text>
                    <Text style={styles.field}>{bookingData.field_name}</Text>

                    <Text style={styles.info}>
                        reservatienummer: {bookingData.id}
                    </Text>

                    <Text style={styles.info}>
                        gereserveerd op: {formatDate(bookingData.createdAt)}
                    </Text>

                    <Text style={styles.info}>
                        Datum: {formatDate(bookingData.start)}
                    </Text>

                    <Text style={styles.info}>
                        Tijd: {formatTime(bookingData.start)} - {formatTime(bookingData.end)}
                    </Text>

                    <Text style={styles.price}>Prijs: €{bookingData.price}</Text>

                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(bookingData.status) + "20" }
                    ]}>
                        <Text style={{ color: getStatusColor(bookingData.status) }}>
                            {formatStatus(bookingData.status)}
                        </Text>
                    </View>
                </View>

                {canCancel && (
                    <Pressable style={styles.cancelBtn} onPress={cancelBooking}>
                        <Text style={styles.cancelText}>Annuleer boeking</Text>
                    </Pressable>
                )}
            </View>

        </View>
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case "confirmed": return "#2ecc71";
        case "cancelled": return "#e74c3c";
        case "finished": return "#95a5a6";
        default: return "#333";
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa"
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
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12
    },
    club: {
        fontSize: 18,
        fontWeight: "bold"
    },
    field: {
        marginTop: 4
    },
    info: {
        marginTop: 8,
        color: "#7f8c8d",
    },
    price: {
        marginTop: 8,
        fontWeight: "bold"
    },
    statusBadge: {
        marginTop: 12,
        padding: 6,
        borderRadius: 6,
        alignSelf: "flex-start"
    },
    cancelBtn: {
        marginTop: 20,
        backgroundColor: "red",
        padding: 12,
        borderRadius: 8
    },
    cancelText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    }
});

export default BookingPage;
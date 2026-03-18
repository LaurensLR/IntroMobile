import React from "react";
import { View, StyleSheet, Text, Pressable, Alert } from "react-native";
import { Timestamp, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/firebase/firebaseConfig";
import {router, useLocalSearchParams} from "expo-router";

const BookingScreen = () => {
    const {
        clubId,
        club_name,
        fieldId,
        field_name,
        selectedDate,
        selectedTime,
        duration,
        price,
        userId
    } = useLocalSearchParams();

    const createBooking = async () => {
        try {
            if (!selectedDate || !selectedTime) return;

            const [day, month] = (selectedDate as string).split("-").map(Number);
            const year = new Date().getFullYear();

            const [hours, minutes] = (selectedTime as string).split(":").map(Number);

            const startDate = new Date(year, month - 1, day, hours, minutes, 0);

            const endDate = new Date(startDate);
            endDate.setMinutes(endDate.getMinutes() + Number(duration));

            const conflictQuery = query(
                collection(FIRESTORE_DB, "bookings"),
                where("clubId", "==", clubId),
                where("fieldId", "==", fieldId),
                where("status", "==", "confirmed")
            );
            const existingBookings = await getDocs(conflictQuery);

            const hasConflict = existingBookings.docs.some((d) => {
                const data = d.data();
                const existingStart = data.start?.toDate?.();
                const existingEnd = data.end?.toDate?.();
                if (!existingStart || !existingEnd) return false;
                return startDate < existingEnd && endDate > existingStart;
            });

            if (hasConflict) {
                Alert.alert("Niet beschikbaar", "Dit veld is net geboekt in dit tijdslot. Kies een ander tijdstip.");
                return;
            }

            await addDoc(collection(FIRESTORE_DB, "bookings"), {
                clubId,
                club_name,
                fieldId,
                field_name,
                userId,
                start: Timestamp.fromDate(startDate), // 🔥 KEY
                end: Timestamp.fromDate(endDate),
                createdAt: Timestamp.now(),
                price: Number(price),
                status: "confirmed"
            });
            console.log("Booking opgeslagen");
            router.push("/booking/bookingConfirmation");

        } catch (error) {
            console.error("Error:", error);
        }
    };

    const formatDate = (dateString: string) => {
        const [day, month] = dateString.split("-").map(Number);
        const date = new Date();
        date.setDate(day);
        date.setMonth(month - 1);

        return date.toLocaleDateString("nl-BE", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const formatTimeRange = (time: string, duration: number) => {
        const [hours, minutes] = time.split(":").map(Number);

        const start = new Date();
        start.setHours(hours);
        start.setMinutes(minutes);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + duration);

        const format = (d: Date) =>
            d.toLocaleTimeString("nl-BE", {
                hour: "2-digit",
                minute: "2-digit"
            });

        return `${format(start)} - ${format(end)}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Jouw boeking</Text>

            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.label}>Club</Text>
                    <Text style={styles.value}>{club_name}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Veld</Text>
                    <Text style={styles.value}>{field_name}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Datum</Text>
                    <Text style={styles.value}>
                        {formatDate(selectedDate as string)}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Tijd</Text>
                    <Text style={styles.value}>
                        {formatTimeRange(selectedTime as string, Number(duration))}
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.priceLabel}>Prijs</Text>
                    <Text style={styles.price}>€ {price}</Text>
                </View>

                <Text style={styles.info}>
                    Bevestig je boeking
                </Text>

                <Pressable style={styles.button} onPress={createBooking}>
                    <Text style={styles.buttonText}>Betalen</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa",
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 20,
        color: "#1e272e",
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
});

export default BookingScreen;
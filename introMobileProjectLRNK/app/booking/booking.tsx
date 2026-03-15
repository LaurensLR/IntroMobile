import React from "react";
import { View, StyleSheet } from "react-native";
import {Timestamp, collection, addDoc} from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/firebase/firebaseConfig";

export interface Booking {
    clubId: string
    fieldId: string
    userId: string
    date: Timestamp
    start: Timestamp
    end: Timestamp
    createdAt: Timestamp
    //status: "confirmed" | "cancelled"
}

const createBooking = async (
    clubId: string,
    fieldId: string,
    userId: string,
    selectedDate: Date,
    selectedTime: string,
    duration: number
) => {
    try {
        const startDate = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(":");

        startDate.setHours(Number(hours));
        startDate.setMinutes(Number(minutes));
        startDate.setSeconds(0);

        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + duration);

        await addDoc(collection(FIRESTORE_DB, "Bookings"), {
            clubId,
            fieldId,
            userId,
            start: Timestamp.fromDate(startDate),
            end: Timestamp.fromDate(endDate),
            createdAt: Timestamp.now()
        });

        console.log("Booking succesvol!");

    } catch (error) {
        console.error("Error creating booking:", error);
    }
};

const BookingScreen = (newBooking: Booking) => {
    return (
        <View style={styles.container}>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})

export default BookingScreen;
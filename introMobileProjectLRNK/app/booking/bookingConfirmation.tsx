import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

const BookingConfirmation = () => {

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.replace("/home");
        }, 300000); // 3 sec

        return () => clearTimeout(timeout);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.circle}>
                <Text style={styles.check}>✓</Text>
            </View>
            <Text style={styles.title}>Boeking bevestigd!</Text>
            <Text style={styles.subtitle}>
                Je veld is succesvol gereserveerd.
            </Text>
            <Pressable
                style={styles.button}
                onPress={() => router.push("/home")}
            >
                <Text style={styles.buttonText}>Ga naar home</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#27ae60",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 25,
    },

    check: {
        fontSize: 50,
        color: "#fff",
        fontWeight: "bold",
    },

    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2c3e50",
        marginBottom: 10,
        textAlign: "center",
    },

    subtitle: {
        fontSize: 15,
        color: "#7f8c8d",
        textAlign: "center",
        marginBottom: 30,
    },

    button: {
        backgroundColor: "#0984e3",
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 12,
    },

    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default BookingConfirmation;
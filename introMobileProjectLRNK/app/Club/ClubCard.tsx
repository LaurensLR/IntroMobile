import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

export interface Field {
    field_id: number;
    club_id: number;
    field_name: string;
    locationType: string;
    walls: string;
    doubles: boolean;
}

export interface Club {
    club_id: number;
    name: string;
    street: string;
    number: number;
    zipcode: number;
    city: string;
    province: string;
    country: string;
    opening_hours: string;
    fields: Field[];
}

interface ClubCardProps {
    club: Club;
    onPress?: () => void;
}

const getLocationType = (fields: Field[]): string => {
    const allInside = fields.every((f) => f.locationType === "inside");
    const allOutside = fields.every((f) => f.locationType === "outside");
    if (allInside) return "Binnen";
    if (allOutside) return "Buiten";
    return "Binnen & Buiten";
};

const ClubCard = ({ club, onPress }: ClubCardProps) => (
    <Pressable
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.75 : 1 }]}
        onPress={onPress ?? (() => router.push(`/Club/${club.club_id}` as any))}
    >
        <Text style={styles.clubName}>{club.name}</Text>
        <Text style={styles.address}>
            {club.street} {club.number}, {club.zipcode} {club.city}
        </Text>
        <View style={styles.badgeRow}>
            <View style={styles.badge}>
                <FontAwesome name="table" size={12} color="#345fff" />
                <Text style={styles.badgeText}>{club.fields.length} banen</Text>
            </View>
            <View style={styles.badge}>
                <FontAwesome name="home" size={12} color="#345fff" />
                <Text style={styles.badgeText}>{getLocationType(club.fields)}</Text>
            </View>
        </View>
    </Pressable>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    clubName: {
        fontSize: 17,
        fontWeight: "800",
        color: "#1a1a1a",
        marginBottom: 4,
    },
    address: {
        fontSize: 14,
        color: "#555",
        marginBottom: 10,
    },
    badgeRow: {
        flexDirection: "row",
        gap: 8,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eef1ff",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 5,
    },
    badgeText: {
        fontSize: 13,
        color: "#345fff",
        fontWeight: "600",
    },
});

export default ClubCard;

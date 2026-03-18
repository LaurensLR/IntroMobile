import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import clubsData from "../../clubs.json";
import { Club } from "./ClubCard";

const ClubDetail = () => {
    const { club_id } = useLocalSearchParams<{ club_id: string }>();
    const club: Club | undefined = (clubsData.clubs as Club[]).find(
        (c) => c.club_id === Number(club_id)
    );

    if (!club) {
        return (
            <View style={styles.centered}>
                <Text>Club niet gevonden.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.name}>{club.name}</Text>
            <View style={styles.infoRow}>
                <FontAwesome name="map-marker" size={15} color="#345fff" />
                <Text style={styles.infoText}>
                    {club.street} {club.number}, {club.zipcode} {club.city}
                </Text>
            </View>
            <View style={styles.infoRow}>
                <FontAwesome name="globe" size={15} color="#345fff" />
                <Text style={styles.infoText}>{club.province}, {club.country}</Text>
            </View>

            <Text style={styles.sectionTitle}>Banen ({club.fields.length})</Text>
            {club.fields.map((field) => (
                <View key={field.field_id} style={styles.fieldCard}>
                    <Text style={styles.fieldName}>{field.field_name}</Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <FontAwesome
                                name={field.locationType === "inside" ? "home" : "sun-o"}
                                size={12}
                                color="#345fff"
                            />
                            <Text style={styles.badgeText}>
                                {field.locationType === "inside" ? "Binnen" : "Buiten"}
                            </Text>
                        </View>
                        <View style={styles.badge}>
                            <FontAwesome name="th-large" size={12} color="#345fff" />
                            <Text style={styles.badgeText}>{field.walls} wanden</Text>
                        </View>
                        {field.doubles && (
                            <View style={styles.badge}>
                                <FontAwesome name="users" size={12} color="#345fff" />
                                <Text style={styles.badgeText}>Dubbel</Text>
                            </View>
                        )}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    content: {
        padding: 16,
        gap: 8,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    name: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1a1a1a",
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 15,
        color: "#444",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1a1a1a",
        marginTop: 20,
        marginBottom: 10,
    },
    fieldCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    fieldName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
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

export default ClubDetail;

import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, Pressable, Image, ImageSourcePropType, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { FIRESTORE_DB } from "@/app/firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface CustomButtonProps {
    onPress: () => void;
    imageSource: ImageSourcePropType;
    label: string;
}

interface Club {
    id: string;
    name: string;
    club_image?: string;
    street?: string;
    number?: string;
    zipcode?: string;
    city?: string;
}

const CustomButton = ({ onPress, imageSource, label }: CustomButtonProps) => (
    <View style={styles.buttonContainer}>
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.circle,
                pressed && { opacity: 0.6 }
            ]}
        >
            <Image source={imageSource} style={styles.buttonImage} />
        </Pressable>
        <Text style={styles.buttonText}>{label}</Text>
    </View>
);

const App = () => {
    const [userClubs, setUserClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchUserClubs = async () => {
            try {
                // Get user's confirmed bookings
                const bookingsQuery = query(
                    collection(FIRESTORE_DB, "bookings"),
                    where("userId", "==", user.uid),
                    where("status", "==", "confirmed")
                );
                const bookingsSnapshot = await getDocs(bookingsQuery);

                // Extract unique clubIds
                const uniqueClubIds = Array.from(
                    new Set(bookingsSnapshot.docs.map((doc) => doc.data().clubId))
                );

                // Fetch club documents
                const clubs: Club[] = [];
                for (const clubId of uniqueClubIds) {
                    const clubRef = doc(FIRESTORE_DB, "clubs", clubId);
                    const clubSnap = await getDoc(clubRef);
                    if (clubSnap.exists()) {
                        clubs.push({
                            id: clubSnap.id,
                            name: clubSnap.data().name,
                            club_image: clubSnap.data().club_image,
                            street: clubSnap.data().street,
                            number: clubSnap.data().number,
                            zipcode: clubSnap.data().zipcode,
                            city: clubSnap.data().city,
                        });
                    }
                }

                setUserClubs(clubs);
            } catch (error) {
                console.error("Error fetching user clubs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserClubs();
    }, [user]);
    return (
        <View style={styles.screen}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.logo}>PLAYTOMIC</Text>
            </View>

            {/* MAIN CONTENT */}
            <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>

                <Text style={styles.title}>
                    Ben je klaar voor jouw volgende wedstrijd?
                </Text>

                {/* BUTTON GRID */}
                <View style={styles.grid}>
                    <CustomButton
                        onPress={() => router.push("/clubs")}
                        imageSource={require("../../../assets/images/bookingpictogram.png")}
                        label="Boek"
                    />
                    <CustomButton
                        onPress={() => router.push("/(tabs)/home")}
                        imageSource={require("../../../assets/images/learningPicto.png")}
                        label="Leren"
                    />
                    <CustomButton
                        onPress={() => router.push("/(tabs)/home")}
                        imageSource={require("../../../assets/images/gamePicto.png")}
                        label="Match"
                    />
                    <CustomButton
                        onPress={() => router.push("/(tabs)/home")}
                        imageSource={require("../../../assets/images/matchPicto.png")}
                        label="Zoek"
                    />
                </View>

                {/* SECTION */}
                <Text style={styles.sectionTitle}>Jouw clubs</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#0984e3" style={styles.loader} />
                ) : userClubs.length === 0 ? (
                    <Text style={styles.emptyText}>Je hebt nog geen boekingen</Text>
                ) : (
                    <View style={styles.clubsContainer}>
                        {userClubs.map((club) => (
                            <Pressable
                                key={club.id}
                                onPress={() =>
                                    router.push({
                                        pathname: "/clubs/[clubId]",
                                        params: { clubId: club.id },
                                    })
                                }
                                style={styles.bookedClubCard}
                            >
                                <Image
                                    source={{ uri: club.club_image }}
                                    style={styles.clubCardImage}
                                />

                                {/* Badge */}
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Geboekt</Text>
                                </View>

                                <View style={styles.clubCardContent}>
                                    <Text style={styles.bookedClubName}>{club.name}</Text>
                                    <Text style={styles.clubCardAddress}>
                                        {club.street} {club.number}
                                    </Text>
                                    <Text style={styles.clubCardAddress}>
                                        {club.zipcode} {club.city}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}

            </ScrollView>
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
        alignItems: "center",
    },

    logo: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "700",
        letterSpacing: 3,
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
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 20,
        color: "#2c3e50",
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginTop: 25,
        marginBottom: 15,
        color: "#2c3e50",
    },

    clubsContainer: {
        marginBottom: 30,
    },

    bookedClubCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        borderLeftWidth: 4,
        borderLeftColor: "#27ae60",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    clubCardImage: {
        width: "100%",
        height: 140,
        resizeMode: "cover",
    },

    badge: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: "#27ae60",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },

    badgeText: {
        color: "#ffffff",
        fontSize: 12,
        fontWeight: "700",
    },

    clubCardContent: {
        padding: 12,
    },

    bookedClubName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2c3e50",
        marginBottom: 4,
    },

    clubCardAddress: {
        fontSize: 12,
        color: "#7f8c8d",
    },

    emptyText: {
        fontSize: 14,
        color: "#95a5a6",
        textAlign: "center",
        marginTop: 20,
        fontStyle: "italic",
    },

    loader: {
        marginTop: 30,
    },

    /* GRID */
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    /* BUTTON */
    buttonContainer: {
        width: "23%",
        alignItems: "center",
        marginBottom: 15,
    },

    circle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#cbff00",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },

    buttonImage: {
        width: "55%",
        height: "55%",
        resizeMode: "contain",
    },

    buttonText: {
        fontSize: 12,
        textAlign: "center",
        color: "#2c3e50",
    },
});

export default App;


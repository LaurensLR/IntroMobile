import React, {useCallback, useState} from "react";
import { View, StyleSheet, Text, Pressable, Image, ImageSourcePropType, ScrollView, ActivityIndicator } from "react-native";
import {router, useFocusEffect} from "expo-router";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import {collection, getDocs, query, Timestamp, where} from "firebase/firestore";
import { getAuth } from "firebase/auth";


interface CustomButtonProps {
    onPress: () => void;
    imageSource: ImageSourcePropType;
    label: string;
}

export type Club = {
    id: string;
    name: string;
    street?: string;
    number?: string;
    zipcode?: string;
    city?: string;
    province?: string;
    country?: string;
    club_image?: string;
};

export type Booking = {
    id: string;
    club_name: string;
    field_name: string;
    price: number;
    status: string;
    start: Timestamp;
    end: Timestamp;
};

export const formatDate = (timestamp: any) => {
    const date = timestamp.toDate();

    return date.toLocaleDateString("nl-BE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export const formatTime = (timestamp: any) => {
    const date = timestamp.toDate();

    return date.toLocaleTimeString("nl-BE", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatStatus = (status: string) => {
    switch (status) {
        case "confirmed":
            return "Bevestigd";
        case "cancelled":
            return "Geannuleerd";
        case "finished":
            return "Voltooid";
        default:
            return status;
    }
};

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
    const [userClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const auth = getAuth();
    const user = auth.currentUser;

    useFocusEffect(
        useCallback(() => {
            if (!user) return;

            const fetchUserBookings = async () => {
                try {
                    setLoading(true);

                    const bookingsQuery = query(
                        collection(FIRESTORE_DB, "bookings"),
                        where("userId", "==", user.uid),
                        where("status", "==", "confirmed"),
                    );

                    const snapshot = await getDocs(bookingsQuery);

                    const bookings = snapshot.docs
                        .map(doc => ({
                            id: doc.id,
                            ...(doc.data() as Omit<Booking, "id">)
                        }))
                        .sort((a, b) =>
                            b.start.toDate().getTime() - a.start.toDate().getTime()
                        );

                    setBookings(bookings);

                } catch (error) {
                    console.error("Error fetching bookings:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchUserBookings();

        }, [user])
    );

    const formatStatus = (status: string) => {
        switch (status) {
            case "confirmed":
                return "Bevestigd";
            case "cancelled":
                return "Geannuleerd";
            case "completed":
                return "Voltooid";
            default:
                return status;
        }
    };

    const messages = [
        `Welkom ${user?.displayName}`,
        "Ben je klaar voor jouw volgende wedstrijd?",
        "Tijd om het veld te domineren!",
        "Wie wordt de winnaar vandaag?",
        "Vandaag is een fantastische dag om padel te spelen!",
    ];

    const [message] = useState(
        messages[Math.floor(Math.random() * messages.length)]
    );


    return (
        <View style={styles.screen}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.logo}>PLAYTOMIC</Text>
            </View>

            {/* MAIN CONTENT */}
            <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>

                <Text style={styles.title}>
                    {message}
                </Text>

                {/* BUTTON GRID */}
                <View style={styles.grid}>
                    <CustomButton
                        onPress={() => router.push("/clubs")}
                        imageSource={require("../../../assets/images/bookingpictogram.png")}
                        label="Boek"
                    />
                    <CustomButton
                        onPress={() => router.push("/score")}
                        imageSource={require("../../../assets/images/learningPicto.png")}
                        label="Leren"
                    />
                    <CustomButton
                        onPress={() => router.push("/match/matchScreen1")}
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
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Boekingen</Text>

                    <Pressable
                        onPress={() => router.push("/booking/bookings")}
                        style={({ pressed }) => [
                            styles.seeAllBtn,
                            pressed && { opacity: 0.6 }
                        ]}
                    >
                        <Text style={styles.seeAllText}>Alle boekingen</Text>
                    </Pressable>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#0984e3" style={styles.loader} />
                ) : bookings.length === 0 ? (
                    <Text style={styles.emptyText}>Je hebt nog geen boekingen</Text>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 16 }}
                    >
                        <View style={styles.clubsContainer}>
                            {bookings.map((booking) => (
                                <Pressable
                                    key={booking.id}
                                    style={({ pressed }) => [
                                        styles.bookedClubCard,
                                        pressed && { opacity: 0.8 }
                                    ]}
                                    onPress={() => router.push({
                                        pathname: "/booking/[booking]",
                                        params: { booking: booking.id }
                                    })}
                                >
                                    <View style={[
                                        styles.badge,
                                        {backgroundColor: getStatusColor(booking.status) + "20"}]}>
                                        <Text
                                            style={[
                                                styles.badgeText,
                                                { color: getStatusColor(booking.status)}
                                            ]}
                                        >
                                            {formatStatus(booking.status)}
                                        </Text>
                                    </View>

                                    <View style={styles.clubCardContent}>
                                        <Text style={styles.bookedClubName}>
                                            {booking.club_name}
                                        </Text>

                                        <Text style={styles.clubCardInfo}>
                                            {booking.field_name}
                                        </Text>

                                        <Text style={styles.clubCardDate}>
                                            {formatDate(booking.start)} {formatTime(booking.start)} - {formatTime(booking.end)}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                )}

                {/* SECTION */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Matches</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#0984e3" style={styles.loader} />
                ) : userClubs.length === 0 ? (
                    <Text style={styles.emptyText}>Je hebt nog geen toekomstige matches</Text>
                ) : (
                    <View style={styles.clubsContainer}>


                    </View>

                )}


            </ScrollView>
        </View>
    );
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case "confirmed":
            return "#27ae60";
        case "cancelled":
            return "#e74c3c";
        default:
            return "#999";
    }
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#335fff",
    },
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
        color: "#2c3e50",
    },

    clubsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    bookedClubCard: {
        width: 300,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        marginRight: 12,
        padding: 12,

        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
    },

    badge: {
        position: "absolute",
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },

    badgeText: {
        fontSize: 10,
        fontWeight: "700",
    },

    clubCardContent: {
        padding: 10,
    },

    bookedClubName: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 2,
        width: "50%",
    },

    clubCardInfo: {
        fontSize: 11,
        color: "#7f8c8d",
    },
    clubCardDate: {
        paddingTop: 8,
        fontSize: 11,
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
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
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
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 25,
        marginBottom: 15,
    },
    seeAllBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    seeAllText: {
        fontSize: 13,
        color: "#345fff",
        fontWeight: "600",
    },
});

export default App;


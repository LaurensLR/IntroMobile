import React, {useCallback, useState} from "react";
import { View, StyleSheet, Text, Pressable, Image, ImageSourcePropType, ScrollView, ActivityIndicator } from "react-native";
import {router, useFocusEffect} from "expo-router";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import {collection, doc, getDocs, query, Timestamp, where, writeBatch} from "firebase/firestore";
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

export type Match = {
    id: string;
    clubName: string;
    fieldName: string;
    start: Timestamp;
    end: Timestamp;
    status: string;
    teams?: {
        team1?: string[];
        team2?: string[];
    };
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
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const auth = getAuth();
    const user = auth.currentUser;

    useFocusEffect(
        useCallback(() => {
            if (!user) {
                setBookings([]);
                setMatches([]);
                setLoading(false);
                return;
            }

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

                    const matchesQuery = query(
                        collection(FIRESTORE_DB, "matches"),
                        where("createdBy", "==", user.uid),
                    );

                    const team1MatchesQuery = query(
                        collection(FIRESTORE_DB, "matches"),
                        where("teams.team1", "array-contains", user.uid),
                    );

                    const team2MatchesQuery = query(
                        collection(FIRESTORE_DB, "matches"),
                        where("teams.team2", "array-contains", user.uid),
                    );

                    const [matchesSnapshot, team1MatchesSnapshot, team2MatchesSnapshot] = await Promise.all([
                        getDocs(matchesQuery),
                        getDocs(team1MatchesQuery),
                        getDocs(team2MatchesQuery),
                    ]);

                    const allMatchDocs = [
                        ...matchesSnapshot.docs,
                        ...team1MatchesSnapshot.docs,
                        ...team2MatchesSnapshot.docs,
                    ];

                    const uniqueMatches = Array.from(
                        new Map(
                            allMatchDocs.map((doc) => [
                                doc.id,
                                {
                                    id: doc.id,
                                    ...(doc.data() as Omit<Match, "id">),
                                },
                            ])
                        ).values()
                    );

                    const now = Date.now();
                    const batch = writeBatch(FIRESTORE_DB);
                    let hasStatusUpdates = false;

                    uniqueMatches.forEach((match) => {
                        const team1Count = (match.teams?.team1 || []).filter(Boolean).length;
                        const team2Count = (match.teams?.team2 || []).filter(Boolean).length;
                        const filledSpots = team1Count + team2Count;

                        const shouldBeFinished = match.end.toDate().getTime() < now;
                        const shouldBeFull = !shouldBeFinished && filledSpots >= 4;
                        const nextStatus = shouldBeFinished ? "finished" : shouldBeFull ? "full" : "open";

                        if (match.status !== nextStatus) {
                            batch.update(doc(FIRESTORE_DB, "matches", match.id), { status: nextStatus });
                            match.status = nextStatus;
                            hasStatusUpdates = true;
                        }
                    });

                    if (hasStatusUpdates) {
                        await batch.commit();
                    }

                    const upcomingMatches = uniqueMatches
                        .filter((match) => match.end.toDate().getTime() >= now)
                        .sort((a, b) => a.start.toDate().getTime() - b.start.toDate().getTime());

                    setMatches(upcomingMatches);

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
            case "open":
                return "Open";
            case "full":
                return "Vol";
            case "finished":
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
                        onPress={() => router.push("/(tabs)/home/searchMatches" as any)}
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

                    <Pressable
                        onPress={() => router.push("/match/matches")}
                        style={({ pressed }) => [
                            styles.seeAllBtn,
                            pressed && { opacity: 0.6 }
                        ]}
                    >
                        <Text style={styles.seeAllText}>Alle matches</Text>
                    </Pressable>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#0984e3" style={styles.loader} />
                ) : matches.length === 0 ? (
                    <Text style={styles.emptyText}>Je hebt nog geen toekomstige matches</Text>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 16 }}
                    >
                        <View style={styles.clubsContainer}>
                            {matches.map((match) => (
                                <Pressable
                                    key={match.id}
                                    style={({ pressed }) => [
                                        styles.bookedClubCard,
                                        pressed && { opacity: 0.8 }
                                    ]}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/match/[matchId]",
                                            params: { matchId: match.id }
                                        } as any)
                                    }
                                >
                                    <View style={[
                                        styles.badge,
                                        { backgroundColor: getStatusColor(match.status) + "20" }
                                    ]}>
                                        <Text style={[
                                            styles.badgeText,
                                            { color: getStatusColor(match.status) }
                                        ]}>
                                            {formatStatus(match.status)}
                                        </Text>
                                    </View>

                                    <View style={styles.clubCardContent}>
                                        <Text style={styles.bookedClubName}>
                                            {match.clubName}
                                        </Text>
                                        <Text style={styles.clubCardInfo}>
                                            {match.fieldName}
                                        </Text>
                                        <Text style={styles.clubCardDate}>
                                            {formatDate(match.start)} {formatTime(match.start)} - {formatTime(match.end)}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>

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
        case "open":
            return "#0984e3";
        case "full":
            return "#f39c12";
        case "finished":
            return "#7f8c8d";
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


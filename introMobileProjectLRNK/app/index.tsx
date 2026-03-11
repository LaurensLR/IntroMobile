import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Text, Pressable, Image, ImageSourcePropType, ActivityIndicator } from "react-native";
import { Redirect, router, useFocusEffect } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE_DB } from "./firebase/firebaseConfig";
import clubsData from "../clubs.json";
import ClubCard, { Club } from "./Club/ClubCard";


interface CustomButtonProps {
    onPress: () => void;
    imageSource: ImageSourcePropType;
    label?: string;
}

const CustomButton = ({ onPress, imageSource, label }: CustomButtonProps) => {
    return (
        
            <View style={styles.ButtonContainer}>
            
            <Pressable
                style={({ pressed }) => [
                    styles.circle, { opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={onPress}
            >
                {imageSource && <Image source={imageSource} style={styles.buttonImage} />}
            </Pressable>
            {label && <Text style={styles.buttonText}>{label}</Text>}
        </View>
    );
 }

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoaded, setAuthLoaded] = useState(false);
    const [needsSetup, setNeedsSetup] = useState(false);
    const [prefsLoaded, setPrefsLoaded] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
            setUser(currentUser);
            setAuthLoaded(true);
            if (!currentUser) {
                setPrefsLoaded(true);
                setNeedsSetup(false);
            }
        });
        return unsubscribe;
    }, []);

    // Re-check prefs every time this screen gains focus (e.g. after saving prefs for the first time)
    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            getDoc(doc(FIRESTORE_DB, "users", user.uid)).then((snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    setNeedsSetup(!data.sport && !data.level);
                } else {
                    setNeedsSetup(true);
                }
            }).finally(() => setPrefsLoaded(true));
        }, [user])
    );

    if (!authLoaded || !prefsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#345fff" />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/Login/Login" />;
    }

    if (needsSetup) {
        return <Redirect href="/users/Profile" />;
    }

    const clubs: Club[] = clubsData.clubs;

    return(
        <ScrollView>
            <Text style={styles.welcomeText}>
                Welcome! Hoe voel je je vandaag?
            </Text>
            <View style={styles.container}>
                <CustomButton
                    onPress={() => router.push("/Club/ClubList")}
                    imageSource={require("../pictures/bookingpictogram.png")}
                    label="Boek een baan"
                />
                <CustomButton
                    onPress={() => router.push("/booking/booking")}
                    imageSource={require("../pictures/learningPicto.png")}
                    label="Leren"
                />
                <CustomButton
                    onPress={() => router.push("/booking/booking")}
                    imageSource={require("../pictures/gamePicto.png")}
                    label="Wedstrijden"
                />
                <CustomButton
                    onPress={() => router.push("/booking/booking")}
                    imageSource={require("../pictures/matchPicto.png")}
                    label="Zoek een match"
                />
            </View>
            <Text style={styles.otherText}>Aanbevolen clubs voor jou</Text>
            <View style={styles.clubList}>
                {clubs.map((club) => (
                    <ClubCard
                        key={club.club_id}
                        club={club}
                    />
                ))}
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    ButtonContainer: {
        maxWidth: "22%",
        alignItems: "center",
        margin: 5,
    },
    buttonText: {
        width: "100%",
        textAlign: "center",
    },
    circle: {
        width: '80%',
        aspectRatio: 1,
        borderRadius: 999, // helft van width/height = perfect rond
        backgroundColor: "#cbff00",
        justifyContent: "center",
        alignItems: "center",
        margin: 15,
    },
    buttonImage: {
        width: "55%",
        height: "55%",
        resizeMode: 'contain',  // preserve aspect ratio
    },
    welcomeText:{
        marginTop: 25,
        marginLeft: 15,
        fontWeight: '800',
        fontSize: 17,
    },
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
    },
    otherText: {
        fontWeight: "800",
        fontSize: 17,
        marginLeft: 15,
        marginTop: 35,
        marginBottom: 12,
    },
    clubList: {
        paddingHorizontal: 15,
        gap: 12,
        paddingBottom: 24,
    },
})

export default App;
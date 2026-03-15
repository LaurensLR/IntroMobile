import {Stack, useLocalSearchParams } from "expo-router";
import React, {useEffect, useState} from "react";
import {View, StyleSheet, Text, Image, ScrollView, TouchableHighlight, Pressable} from "react-native";
import {Club} from "@/app/clubs/clubs";
import { FIRESTORE_DB } from "@/app/firebase/firebaseConfig";
import { doc, getDoc } from "@firebase/firestore";


const club = () => {
    const {clubId} = useLocalSearchParams<{ clubId: string }>();
    const [club, setClub] = useState<Club>();

    useEffect(() => {
        if (!clubId) return;

        const fetchClub = async () => {
            try {
                const docRef = doc(FIRESTORE_DB, "clubs", clubId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setClub({id: docSnap.id, ...(docSnap.data() as Omit<Club, "id">)});
                } else {
                    console.log("Geen club gevonden!");
                }
            } catch (error) {
                console.error("Error fetching club:", error);
            }
        };

        fetchClub();
    }, [clubId]);

    const timeSlots = [
        "08:00","08:30","09:00","09:30","10:00","10:30",
        "11:00","11:30","12:00","12:30","13:00","13:30",
        "14:00","14:30","15:00","15:30","16:00","16:30",
        "17:00","17:30","18:00","18:30","19:00","19:30",
        "20:00","20:30","21:00","21:30","22:00","22:30","23:00"
    ];

    const weekdays = ["ma", "di", "wo", "do", "vr", "za", "zo", ""];
    const months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

    const today = new Date();

    const upcomingDays: Date[] = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        upcomingDays.push(d);
    }


    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    return (
        <View style={styles.container}>
            <Stack.Screen options={{headerTitle: ``}}></Stack.Screen>
            {club ? (
                <>
                    <Image style={styles.clubImage}
                           source={{ uri: club.club_image }}/>
                    <ScrollView style={styles.items}>
                        <Text style={styles.clubName}>{club.club_name}</Text>
                        <Text style={styles.clubAddress}>{club.street} {club.number}, {club.zipcode} {club.city}</Text>

                        <Text style={styles.space}></Text>

                        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
                            {upcomingDays.map((day, index) => {
                                const dateString = `${day.getDate()}-${day.getMonth() + 1}`;
                                console.log(day.getDay())
                                return (
                                    <View key={index} style={{ alignItems: "center", margin: 5 }}>

                                        <Text>{weekdays[day.getDay()]}</Text>


                                        <Pressable
                                            onPress={() => {
                                                setSelectedDate(dateString);
                                                console.log("Selected:", dateString);
                                            }}
                                            style={[
                                                styles.date,
                                                selectedDate === dateString ? styles.selected : null
                                            ]}
                                        >
                                            <Text>{day.getDate()}</Text>
                                        </Pressable>

                                        <Text>{months[day.getMonth()]}</Text>

                                    </View>
                                );
                            })}
                        </View>

                        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center"}}>
                            {timeSlots.map((t) => (
                                <Pressable
                                    key={t}
                                    onPress={() => {
                                        setSelectedTime(t);
                                        console.log("Geselecteerd:", t);
                                    }}
                                    style={({ pressed }) => [
                                        styles.box,
                                        selectedTime === t ? styles.selected : null,
                                        pressed ? styles.pressed : null
                                    ]}
                                >
                                    <Text style={styles.text}>{t}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>

                </>
            ) : (
                <Text>Laden...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    clubName: {
        fontSize: 25,
        fontWeight: "bold",
    },
    clubImage: {
        width: "100%",
        height: "30%",
        resizeMode: "cover",
    },
    clubAddress: {
        fontSize: 10,
        paddingTop: 10
    },
    items: {
        flex: 1,
        padding: 10,
    },
    space: {
        padding: 5
    },
    box: {
        width: 50,
        height: 50,
        backgroundColor: "#e4e4e4",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        margin: 5,
    },
    selected: {
        backgroundColor: "#b3b3b3",
    },
    pressed: {
        opacity: 0.7,
    },
    text: {
        color: "#000",
        fontWeight: "bold",
    },
    date: {
        width: 35,
        height: 35,
        backgroundColor: "#e4e4e4",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 25,
        margin: 4,
    }
})

export default club;
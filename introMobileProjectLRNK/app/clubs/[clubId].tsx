import {router, Stack, useLocalSearchParams} from "expo-router";
import React, {useEffect, useState} from "react";
import {View, StyleSheet, Text, Image, ScrollView, Pressable} from "react-native";
import {Club} from "@/app/clubs/index";
import { FIRESTORE_DB } from "@/app/firebase/firebaseConfig";
import { doc, getDoc } from "@firebase/firestore";
import {collection, getDocs, Timestamp} from "firebase/firestore";
import {Booking} from "@/app/booking/booking";
import {getAuth} from "firebase/auth";

type Field = {
    id: string;
    field_name: string;
    locationType: string;
    Walls: string,
    doubles: boolean,
}

const ClubScreen = () => {

    const {clubId} = useLocalSearchParams<{ clubId: string }>();
    const [club, setClub] = useState<Club>();
    const [fields, setFields] = useState<Field[]>([]);
    const [openField, setOpenField] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    useEffect(() => {
        const fetchFields = async () => {
            try {

                const fieldsRef = collection(FIRESTORE_DB, "clubs", clubId, "fields");
                const snapshot = await getDocs(fieldsRef);

                const fieldsList: Field[] = snapshot.docs.map(doc => {
                    const data = doc.data();

                    return {
                        id: doc.id,
                        field_name: data.field_name,
                        locationType: data.locationType,
                        Walls: data.Walls,
                        doubles: data.doubles
                    };
                }).sort((a, b) => {
                    const numA = parseInt(a.field_name.match(/\d+/)?.[0] || "0");
                    const numB = parseInt(b.field_name.match(/\d+/)?.[0] || "0");
                    return numA - numB;
                });

                setFields(fieldsList);

            } catch (error) {
                console.log("Error fetching fields:", error);
            }
        };
        if (!clubId) return;
        fetchFields();

    }, [clubId]);



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

    const weekdays: string[] = ["zo","ma","di","wo","do","vr","za"];
    const months: string[] = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

    const upcomingDays = React.useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d;
        });
    }, []);

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.log("User niet ingelogd");
        return;
    }

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (selectedDate && selectedTime) {
        const [day, month] = selectedDate.split("-").map(Number);
        const [hours, minutes] = selectedTime.split(":").map(Number);

        startDate = new Date();
        startDate.setMonth(month - 1);
        startDate.setDate(day);
        startDate.setHours(hours);
        startDate.setMinutes(minutes);
        startDate.setSeconds(0);

        endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + 60); // 60 min booking
    }

    const newBooking: Booking | null =
        startDate && endDate && openField
            ? {
                clubId,
                fieldId: openField,
                userId: user.uid,
                date: Timestamp.fromDate(startDate),
                start: Timestamp.fromDate(startDate),
                end: Timestamp.fromDate(endDate),
                createdAt: Timestamp.now(),
            }
            : null;

    if (!newBooking) {
        console.log("Booking is ongeldig");
        return;
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerTitle: "" }} />
            {club ? (
                <>
                    <Image style={styles.clubImage}
                           source={{ uri: club.club_image }}/>
                    <ScrollView style={styles.items}>
                        <Text style={styles.clubName}>{club.name}</Text>
                        <Text style={styles.clubAddress}>{club.street} {club.number}, {club.zipcode} {club.city}</Text>

                        {/*Dagen */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 20, marginTop: 20 }}>
                            {upcomingDays.map((day, index) => {
                                const dateString = `${day.getDate()}-${day.getMonth() + 1}`;
                                return (
                                    <View key={index} style={styles.bookingdates}>
                                        <Text>{weekdays[day.getDay()]}</Text>
                                        <Pressable
                                            onPress={() => {
                                                setSelectedDate(dateString);
                                            }}
                                            style={[
                                                styles.date,
                                                selectedDate === dateString && styles.selected
                                            ]}
                                        >
                                            <Text>{day.getDate()}</Text>
                                        </Pressable>
                                        <Text>{months[day.getMonth()]}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/*tijdstippen*/}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center"}}>
                            {timeSlots.map((t) => (
                                <Pressable
                                    key={t}
                                    onPress={() => {
                                        setSelectedTime(t);
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

                        {/*Velden */}
                        <View style={{marginBottom: 30}}>
                            {fields.map((field) => {
                                const isOpen = openField === field.id;

                                return (
                                    <View key={field.id} style={styles.fieldContainer}>

                                        <Pressable
                                            style={styles.fieldHeader}
                                            onPress={() =>
                                                setOpenField(isOpen ? null : field.id)
                                            }
                                        >
                                            <View>
                                                <Text style={styles.fieldTitle}>
                                                    {field.field_name}
                                                </Text>

                                                <Text style={styles.fieldInfo}>
                                                    {field.locationType} | {field.Walls}  | Dubbelspel
                                                </Text>
                                            </View>

                                            <Text style={{fontSize:20}}>
                                                {isOpen ? "⌃" : "⌄"}
                                            </Text>
                                        </Pressable>

                                        {isOpen && (
                                            <View style={styles.priceContainer}>
                                                <Pressable
                                                    style={styles.priceBox}
                                                    onPress={() => router.push("../booking/booking")}
                                                >
                                                    <Text style={styles.price}>€25</Text>
                                                    <Text>60 min</Text>
                                                </Pressable>

                                                <Pressable
                                                    style={styles.priceBox}
                                                    onPress={() =>
                                                        router.push({
                                                            pathname: "/booking/booking",
                                                            params: {
                                                                clubId,
                                                                fieldId: field.id,
                                                                date: selectedDate,
                                                                time: selectedTime,
                                                                duration: 60
                                                            }
                                                        })
                                                    }>
                                                    <Text style={styles.price}>€35</Text>
                                                    <Text>90 min</Text>
                                                </Pressable>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
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
    bookingdates: {
        alignItems: "center",
        marginTop: 5
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
    },
    fieldContainer:{
        borderBottomWidth: 1,
        borderColor: "#ddd",
        paddingVertical: 15,
    },

    fieldHeader:{
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center"
    },

    fieldTitle:{
        fontSize:20,
        fontWeight:"600"
    },

    fieldInfo:{
        color:"gray",
        marginTop:4
    },

    priceContainer:{
        flexDirection:"row",
        marginTop:15,
        gap:15
    },

    priceBox:{
        backgroundColor:"#6C83E6",
        padding:20,
        borderRadius:15,
        width:120,
        alignItems:"center"
    },

    price:{
        fontSize:28,
        fontWeight:"bold",
        color:"white"
    }
})

export default ClubScreen;
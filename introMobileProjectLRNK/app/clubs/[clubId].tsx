import {router, useLocalSearchParams} from "expo-router";
import React, {useEffect, useMemo, useState} from "react";
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {Club} from "@/app/clubs/index";
import {FIRESTORE_DB} from "@/app/firebase/firebaseConfig";
import {collection, doc, getDoc, getDocs, onSnapshot, query, Timestamp, where} from "firebase/firestore";
import {getAuth} from "firebase/auth";

export type Field = {
    id: string;
    field_name: string;
    locationType: string;
    walls: string;
    doubles: boolean;
};

export type Booking = {
    fieldId: string;
    start: Timestamp;
    end: Timestamp;
    status?: string;
};

export const TIME_SLOTS = [
    "08:00","08:30","09:00","09:30","10:00","10:30",
    "11:00","11:30","12:00","12:30","13:00","13:30",
    "14:00","14:30","15:00","15:30","16:00","16:30",
    "17:00","17:30","18:00","18:30","19:00","19:30",
    "20:00","20:30","21:00","21:30","22:00","22:30","23:00"
];

export const WEEKDAYS = ["zo","ma","di","wo","do","vr","za"];
export const MONTHS = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
const BOOKING_DURATION = 60;

const getSlotRange = (selectedDate: string, time: string, duration: number) => {
    const [day, month] = selectedDate.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const year = new Date().getFullYear();

    const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    return { start, end };
};

const overlaps = (
    slotStart: Date,
    slotEnd: Date,
    bookingStart: Date,
    bookingEnd: Date
) => slotStart < bookingEnd && slotEnd > bookingStart;

const ClubScreen = () => {
    const { clubId } = useLocalSearchParams<{ clubId: string }>();

    const [club, setClub] = useState<Club>();
    const [fields, setFields] = useState<Field[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [openField, setOpenField] = useState<string | null>(null);

    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        if (!clubId) return;

        const fetchData = async () => {
            try {
                const docRef = doc(FIRESTORE_DB, "clubs", clubId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setClub({ id: docSnap.id, ...(docSnap.data() as Omit<Club, "id">) });
                }

                // fields
                const fieldsRef = collection(FIRESTORE_DB, "clubs", clubId, "fields");
                const snapshot = await getDocs(fieldsRef);

                const sortedFields: Field[] = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Field))
                    .sort((a, b) => {
                        const numA = parseInt(a.field_name.match(/\d+/)?.[0] || "0");
                        const numB = parseInt(b.field_name.match(/\d+/)?.[0] || "0");
                        return numA - numB;
                    });

                setFields(sortedFields);

            } catch (error) {
                console.error("Fetch error:", error);
            }
        };

        fetchData();
    }, [clubId]);

    useEffect(() => {
        if (!clubId) return;

        const ref = query(
            collection(FIRESTORE_DB, "bookings"),
            where("clubId", "==", clubId),
            where("status", "==", "confirmed")
        );

        return onSnapshot(
            ref,
            (snapshot) => {
                const data = snapshot.docs
                    .map((d) => d.data() as Booking)
                    .filter((b) => b.start && b.end && b.fieldId);

                setBookings(data);
            },
            (error) => {
                console.error("Error fetching bookings:", error);
            }
        );
    }, [clubId]);

    const isFieldBooked = (fieldId: string, time: string, duration: number) => {
        if (!selectedDate) return false;

        const { start, end } = getSlotRange(selectedDate, time, duration);

        return bookings.some((b) => {
            if (b.fieldId !== fieldId) return false;
            const bStart = b.start.toDate();
            const bEnd = b.end.toDate();
            return overlaps(start, end, bStart, bEnd);
        });
    };

    const isTimeFullyBooked = (time: string, duration: number) => {
        if (!selectedDate || fields.length === 0) return false;
        return fields.every((field) => isFieldBooked(field.id, time, duration));
    };

    const availableTimeSlots = useMemo(() => {
        if (!selectedDate) return TIME_SLOTS;

        const now = new Date();
        const [day, month] = selectedDate.split("-").map(Number);

        const isToday =
            now.getDate() === day &&
            now.getMonth() + 1 === month;

        if (!isToday) return TIME_SLOTS;

        return TIME_SLOTS.filter(time => {
            const [h, m] = time.split(":").map(Number);
            const date = new Date();
            date.setHours(h, m, 0);
            return date > now;
        });
    }, [selectedDate]);

    const upcomingDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d;
        });
    }, []);

    if (!user) return <Text>Niet ingelogd</Text>;
    if (!club) return <Text>Laden...</Text>;

    const handleBooking = (field: Field, duration: number, price: number) => {
        if (!selectedDate || !selectedTime) {
            alert("Kies eerst datum en tijd");
            return;
        }

        router.push({
            pathname: "/booking/booking",
            params: {
                clubId,
                club_name: club.name,
                fieldId: field.id,
                field_name: field.field_name,
                selectedDate,
                selectedTime,
                duration,
                price,
                userId: user.uid
            }
        });
    };

    return (
        <View style={styles.container}>
            <Image style={styles.clubImage} source={{ uri: club.club_image }} />
            <ScrollView style={styles.items}>
                <Text style={styles.clubName}>{club.name}</Text>
                <Text style={styles.clubAddress}>
                    {club.street} {club.number}, {club.zipcode} {club.city}
                </Text>

                {/* DATE */}
                <View style={styles.row}>
                    {upcomingDays.map((day, i) => {
                        const dateStr = `${day.getDate()}-${day.getMonth() + 1}`;
                        return (
                            <View key={i} style={styles.bookingDates}>
                                <Text>{WEEKDAYS[day.getDay()]}</Text>
                                <Pressable
                                    onPress={() =>
                                        setSelectedDate(prev => prev === dateStr ? null : dateStr)
                                    }
                                    style={[
                                        styles.date,
                                        selectedDate === dateStr && styles.selected
                                    ]}
                                >
                                    <Text>{day.getDate()}</Text>
                                </Pressable>
                                <Text>{MONTHS[day.getMonth()]}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* TIME */}
                <View style={styles.row}>
                    {availableTimeSlots.map(t => {
                        const fullyBooked = isTimeFullyBooked(t, BOOKING_DURATION);
                        return (
                            <Pressable
                                key={t}
                                disabled={fullyBooked}
                                onPress={() =>
                                    setSelectedTime(prev => prev === t ? null : t)
                                }
                                style={[
                                    styles.box,
                                    selectedTime === t && styles.selected,
                                    fullyBooked && styles.disabled]}
                            >
                                <Text style={[styles.text, fullyBooked && styles.disabledText]}>
                                    {t}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* FIELDS */}
                {fields.map(field => {
                    const isOpen = openField === field.id;
                    const isValid = selectedDate && selectedTime;

                    return (
                        <View key={field.id} style={styles.fieldContainer}>
                            <Pressable
                                style={styles.fieldHeader}
                                onPress={() => setOpenField(isOpen ? null : field.id)}
                            >
                                <View>
                                    <Text style={styles.fieldTitle}>{field.field_name}</Text>
                                    <Text style={styles.fieldInfo}>{field.locationType} | {field.walls} | Dubbelspel</Text>
                                </View>
                                <Text>{isOpen ? "▲" : "▼"}</Text>
                            </Pressable>

                            {isOpen && (
                                <View style={styles.priceContainer}>
                                    {[{ d: 60, p: 25 }, { d: 90, p: 35 }].map((opt) => {
                                        const unavailable =
                                            !isValid ||
                                            isFieldBooked(field.id, selectedTime as string, opt.d);

                                        return (
                                        <Pressable
                                            key={opt.d}
                                            disabled={unavailable}
                                            style={[styles.priceBox, unavailable && styles.disabled]}
                                            onPress={() => handleBooking(field, opt.d, opt.p)}
                                        >
                                            <Text style={styles.price}>€{opt.p}</Text>
                                            <Text>{opt.d} min</Text>
                                        </Pressable>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa",
    },
    clubImage: {
        width: "100%",
        height: "30%",
        resizeMode: "cover",
    },
    items: {
        flex: 1,
        padding: 16,
    },
    clubName: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2c3e50",
        marginTop: 10,
    },
    clubAddress: {
        fontSize: 13,
        color: "#7f8c8d",
        marginTop: 5,
    },
    bookingDates: {
        alignItems: "center",
        marginHorizontal: 6,
    },
    date: {
        width: 40,
        height: 40,
        borderRadius: 21,
        backgroundColor: "#ecf0f1",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 6,
    },

    selected: {
        backgroundColor: "#0984e3",
    },
    box: {
        width: 65,
        height: 45,
        backgroundColor: "#ecf0f1",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        margin: 6,
    },
    text: {
        fontWeight: "600",
        color: "#2c3e50",
    },
    fieldContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    fieldHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    fieldTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2c3e50",
    },
    fieldInfo: {
        fontSize: 13,
        color: "#7f8c8d",
        marginTop: 4,
    },
    priceContainer: {
        flexDirection: "row",
        marginTop: 15,
        gap: 12,
    },
    priceBox: {
        flex: 1,
        backgroundColor: "#0984e3",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    price: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
    },
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginVertical: 20,
    },
    disabled: {
        backgroundColor: "#ccc",
        opacity: 0.5,
    },
    disabledText: {
        color: "#888",
    },
});

export default ClubScreen;

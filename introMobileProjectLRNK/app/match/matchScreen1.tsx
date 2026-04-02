import React, {useEffect, useState} from "react";
import {View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, Pressable, Image} from "react-native";
import {collection, getDocs, query, where} from "@firebase/firestore";
import {FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";
import {router} from "expo-router";
import {Club} from "@/app/clubs";
import {Field, TIME_SLOTS} from "@/app/clubs/[clubId]";
import Header from "@/app/components/header";

const MATCH_DURATION = 90;

type ReservedSlot = {
    fieldId: string;
    start: Date;
    end: Date;
};

const MatchScreen1 = () => {

    const [search, setSearch] = useState("");
    const [clubs, setClubs] = useState<Club[]>([]);
    const [filteredData, setFilteredData] = useState<Club[]>([]);
    const [openClub, setOpenClub] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [selectedField, setSelectedField] = useState<Field| null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [reservedSlots, setReservedSlots] = useState<ReservedSlot[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const snapshot = await getDocs(collection(FIRESTORE_DB, "clubs"));

            const clubList: Club[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Club[];

            setClubs(clubList);
            setFilteredData(clubList);
        };

        fetchData();
    }, []);

    const handleSearch = (text: string) => {
        setSearch(text);
        setFilteredData(
            clubs.filter((c) =>
                c.name.toLowerCase().includes(text.toLowerCase())
            )
        );
    };

    const getNextDays = () => {
        const days: { key: string; label: string }[] = [];
        const today = new Date();

        for (let i = 1; i <= 30; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");

            const formatted = d.toLocaleDateString("nl-BE", {
                day: "numeric",
                month: "short",
            });

            days.push({
                key: `${year}-${month}-${day}`,
                label: formatted,
            });
        }

        return days;
    };

    const getSlotRange = (dateKey: string, time: string) => {
        const [year, month, day] = dateKey.split("-").map(Number);
        const [hours, minutes] = time.split(":").map(Number);

        const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + MATCH_DURATION);

        return { start, end };
    };

    const hasConflict = (fieldId: string, dateKey: string, time: string) => {
        const { start, end } = getSlotRange(dateKey, time);
        return reservedSlots.some((slot) => (
            slot.fieldId === fieldId && start < slot.end && end > slot.start
        ));
    };

    const getAvailableTimes = (dateKey: string) => {
        const now = new Date();
        const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        return TIME_SLOTS.filter((time) => {
            const { start } = getSlotRange(dateKey, time);
            if (start < minDate) return false;

            if (fields.length === 0) return true;
            return fields.some((field) => !hasConflict(field.id, dateKey, time));
        });
    };

    const NEXT_DAYS = getNextDays();

    return (
        <View style={styles.container}>

            <Header title="Nieuw wedstrijd" />

            <TextInput
                style={styles.searchBar}
                placeholder="Zoek een club..."
                value={search}
                onChangeText={handleSearch}
            />

            <Text style={styles.title}>Kies een club</Text>

            <ScrollView >
                {[...filteredData]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((club) => {
                    const isOpen = openClub === club.id;

                    return (
                        <View key={club.id} style={styles.clubContainer}>
                            <Pressable
                                style={styles.clubHeader}
                                onPress={async () => {
                                    if (isOpen) {
                                        setOpenClub(null);
                                        setSelectedDate(null);
                                        setSelectedTime(null);
                                        setSelectedField(null);
                                        setReservedSlots([]);
                                        return;
                                    }

                                    setOpenClub(club.id);
                                    setSelectedDate(null);
                                    setSelectedTime(null);
                                    setSelectedField(null);

                                    const snapshot = await getDocs(
                                        collection(FIRESTORE_DB, "clubs", club.id, "fields")
                                    );

                                    const fieldList = snapshot.docs
                                        .map((doc) => ({
                                            id: doc.id,
                                            field_name: doc.data(),
                                            ...doc.data(),
                                        }))
                                        .sort((a, b) => a.field_name.localeCompare(b.field_name));

                                    const bookingsQuery = query(
                                        collection(FIRESTORE_DB, "bookings"),
                                        where("clubId", "==", club.id),
                                        where("status", "==", "confirmed"),
                                    );

                                    const matchesQuery = query(
                                        collection(FIRESTORE_DB, "matches"),
                                        where("clubId", "==", club.id),
                                    );

                                    const [bookingsSnapshot, matchesSnapshot] = await Promise.all([
                                        getDocs(bookingsQuery),
                                        getDocs(matchesQuery),
                                    ]);

                                    const bookingSlots: ReservedSlot[] = bookingsSnapshot.docs
                                        .map((doc) => doc.data())
                                        .filter((data) => data.fieldId && data.start?.toDate && data.end?.toDate)
                                        .map((data) => ({
                                            fieldId: data.fieldId,
                                            start: data.start.toDate(),
                                            end: data.end.toDate(),
                                        }));

                                    const matchSlots: ReservedSlot[] = matchesSnapshot.docs
                                        .map((doc) => doc.data())
                                        .filter((data) => (
                                            data.fieldId && data.start?.toDate && data.end?.toDate && data.status !== "finished"
                                        ))
                                        .map((data) => ({
                                            fieldId: data.fieldId,
                                            start: data.start.toDate(),
                                            end: data.end.toDate(),
                                        }));

                                    setFields(fieldList);
                                    setReservedSlots([...bookingSlots, ...matchSlots]);
                                }}
                            >
                                <View style={styles.clubLeft}>
                                    <Image
                                        source={{ uri: club.club_image }}
                                        style={styles.clubImage}
                                    />

                                    <View>
                                        <Text style={styles.clubTitle}>{club.name}</Text>
                                        <Text style={styles.clubInfo}>{club.city}</Text>
                                    </View>
                                </View>

                                <Text>{isOpen ? "▲" : "▼"}</Text>
                            </Pressable>

                            {isOpen && (
                                <View style={styles.timeContainer}>
                                    <Text style={styles.sectionTitle}>Kies een datum</Text>

                                    <View style={{ flexDirection: "row", flexWrap: "wrap", paddingBottom:15 }}>
                                        {NEXT_DAYS.map((dateOption) => (
                                            <Pressable
                                                key={dateOption.key}
                                                style={[
                                                    styles.timeSlot,
                                                    selectedDate === dateOption.key && styles.timeSlotSelected
                                                ]}
                                                onPress={() => {
                                                    setSelectedDate(dateOption.key);
                                                    setSelectedTime(null); // reset time bij nieuwe datum
                                                    setSelectedField(null);
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.timeText,
                                                        selectedDate === dateOption.key && styles.timeTextSelected
                                                    ]}
                                                >
                                                    {dateOption.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                    {selectedDate && (
                                        <>
                                            <Text style={styles.sectionTitle}>Kies een tijdstip</Text>

                                            <View style={{ flexDirection: "row", flexWrap: "wrap", paddingBottom:15 }}>
                                                {getAvailableTimes(selectedDate).map((time) => (
                                                    <Pressable
                                                        key={time}
                                                        style={[
                                                            styles.timeSlot,
                                                            selectedTime === time && styles.timeSlotSelected
                                                        ]}
                                                        onPress={() => {
                                                            setSelectedTime(prev => prev === time ? null : time);
                                                            setSelectedField(null);
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.timeText,
                                                                selectedTime === time && styles.timeTextSelected
                                                            ]}
                                                        >
                                                            {time}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </View>
                                        </>
                                    )}


                                    {/* 👇 FIELDS */}
                                    {selectedTime && (
                                        <>
                                            <Text style={styles.sectionTitle}>Kies een veld</Text>

                                            {fields.length === 0 ? (
                                                <Text>Geen velden beschikbaar</Text>
                                            ) : (
                                                fields.map((field) => {
                                                    const unavailable = !selectedDate || !selectedTime || hasConflict(field.id, selectedDate, selectedTime);

                                                    return (
                                                    <Pressable
                                                        key={field.id}
                                                        disabled={unavailable}
                                                        style={[
                                                            styles.court,
                                                            selectedField?.id === field.id && styles.courtSelected,
                                                            unavailable && styles.courtDisabled,
                                                        ]}
                                                        onPress={() =>
                                                            setSelectedField(prev => prev?.id === field.id ? null : field)
                                                        }
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.courtText,
                                                                selectedField?.id === field.id && styles.courtTextSelected,
                                                                unavailable && styles.courtTextDisabled,
                                                            ]}
                                                        >
                                                            {unavailable ? `${field.field_name} (niet beschikbaar)` : field.field_name}
                                                        </Text>
                                                    </Pressable>
                                                    )
                                                })
                                            )}
                                        </>
                                    )}

                                    {/* 👇 NEXT */}
                                    {selectedTime && selectedField && (
                                        <TouchableOpacity
                                            style={styles.nextButton}
                                            onPress={() =>
                                                router.push({
                                                    pathname: "/match/matchScreen2",
                                                    params: {
                                                        clubId: club.id,
                                                        clubName: club.name,
                                                        date: selectedDate,
                                                        time: selectedTime,
                                                        fieldId: selectedField.id,
                                                        fieldName: selectedField.field_name,
                                                    },
                                                })
                                            }
                                        >
                                            <Text style={styles.nextButtonText}>Volgende</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },

    closeBtn: {
        position: "absolute",
        left: 15,
    },

    closeText: {
        fontSize: 20,
        color: "#333",
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111",
    },

    searchBar: {
        backgroundColor: "#fff",
        margin: 15,
        padding: 12,
        borderRadius: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: "#eee",
    },

    title: {
        fontSize: 16,
        fontWeight: "600",
        marginHorizontal: 15,
        marginBottom: 20,
        color: "#333",
    },

    clubContainer: {
        backgroundColor: "#fff",
        marginHorizontal: 15,
        marginBottom: 12,
        borderRadius: 14,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },

    clubHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
    },

    clubLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    clubImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
    },

    clubTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111",
    },

    clubInfo: {
        fontSize: 12,
        color: "#777",
    },

    timeContainer: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },

    sectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 15,
        color: "#333",
    },

    timeSlot: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: "#f5f6fa",
        marginRight: 8,
        marginBottom: 8,
    },

    timeSlotSelected: {
        backgroundColor: "#007AFF",
    },

    timeText: {
        fontSize: 13,
        color: "#333",
    },

    timeTextSelected: {
        color: "#fff",
        fontWeight: "600",
    },

    court: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: "#f5f6fa",
        marginBottom: 12,
    },

    courtSelected: {
        backgroundColor: "#007AFF",
    },

    courtDisabled: {
        opacity: 0.45,
    },

    courtText: {
        fontSize: 14,
        color: "#333",
    },

    courtTextDisabled: {
        color: "#6b7280",
    },

    courtTextSelected: {
        color: "#fff",
        fontWeight: "600",
    },

    nextButton: {
        marginTop: 15,
        backgroundColor: "#007AFF",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },

    nextButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
});

export default MatchScreen1;
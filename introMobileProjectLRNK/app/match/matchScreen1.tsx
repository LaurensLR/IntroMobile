import React, {useEffect, useState} from "react";
import {View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, Pressable, Image} from "react-native";
import {collection, getDocs} from "@firebase/firestore";
import {FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";
import {router} from "expo-router";
import {Club} from "@/app/clubs";
import {Field, TIME_SLOTS} from "@/app/clubs/[clubId]";
import Header from "@/app/components/header";

const MatchScreen1 = () => {

    const [search, setSearch] = useState("");
    const [clubs, setClubs] = useState<Club[]>([]);
    const [filteredData, setFilteredData] = useState<Club[]>([]);
    const [openClub, setOpenClub] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [selectedField, setSelectedField] = useState<Field| null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
        const days = [];
        const today = new Date();

        for (let i = 1; i <= 4; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);

            const formatted = d.toLocaleDateString("nl-BE", {
                day: "numeric",
                month: "short",
            });

            days.push(formatted);
        }

        return days;
    };

    const getAvailableTimes = (date: string) => {
        const now = new Date();
        const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        return TIME_SLOTS.filter((time) => {
            const [hours, minutes] = time.split(":").map(Number);

            // maak datetime van geselecteerde datum + tijd
            const d = new Date();
            const [day] = date.split(" ");

            d.setDate(parseInt(day));
            d.setMonth(new Date().getMonth()); // huidige maand
            d.setHours(hours);
            d.setMinutes(minutes);
            d.setSeconds(0);

            return d >= minDate;
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

                                    setFields(fieldList);
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
                                        {NEXT_DAYS.map((date) => (
                                            <Pressable
                                                key={date}
                                                style={[
                                                    styles.timeSlot,
                                                    selectedDate === date && styles.timeSlotSelected
                                                ]}
                                                onPress={() => {
                                                    setSelectedDate(date);
                                                    setSelectedTime(null); // reset time bij nieuwe datum
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.timeText,
                                                        selectedDate === date && styles.timeTextSelected
                                                    ]}
                                                >
                                                    {date}
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
                                                fields.map((field) => (
                                                    <Pressable
                                                        key={field.id}
                                                        style={[
                                                            styles.court,
                                                            selectedField?.id === field.id && styles.courtSelected
                                                        ]}
                                                        onPress={() =>
                                                            setSelectedField(prev => prev?.id === field.id ? null : field)
                                                        }
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.courtText,
                                                                selectedField?.id === field.id && styles.courtTextSelected
                                                            ]}
                                                        >
                                                            {field.field_name}
                                                        </Text>
                                                    </Pressable>
                                                ))
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

    courtText: {
        fontSize: 14,
        color: "#333",
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
{/* Gebruiker kan kiezen tussen competitief of vriendschappelijk en met welk
* geslacht hij/zij het liefst speelt.*/}

import React, { useState } from "react";
import {View, StyleSheet, Text, TouchableOpacity, ScrollView} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import Header from "@/app/components/header";

const RadioButton = ({ selected }: { selected: boolean }) => {
    return (
        <View style={styles.radioOuter}>
            {selected && <View style={styles.radioInner} />}
        </View>
    );
};

const Preferences = () => {
    const {
        clubId,
        clubName,
        fieldId,
        fieldName,
        date,
        time,
    } = useLocalSearchParams();

    const [competitive, setCompetitive] = useState(true);
    const [gender, setGender] = useState("all");

    return (

        <View style={{ flex: 1, backgroundColor: "#fff" }}>

            <Header title="" />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.container}>

                    <Text style={styles.title}>Configureer je wedstrijd</Text>

                    <View>
                        <Text style={styles.sectionTitle}>Kies het soort wedstrijd</Text>

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => setCompetitive(true)}
                        >
                            <RadioButton selected={competitive} />
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>Competitieve wedstrijd</Text>
                                <Text style={styles.optionDesc}>
                                    Het resultaat heeft invloed op je niveau en ranking.
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {competitive && (
                            <View style={styles.infoCard}>
                                <Text style={styles.infoTitle}>Rang van het partijniveau</Text>
                                <Text style={styles.infoValue}>0.25 - 1.25</Text>
                                <Text style={styles.infoDesc}>
                                    Spelers buiten bereik kunnen aanvragen
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => setCompetitive(false)}
                        >
                            <RadioButton selected={!competitive} />
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>Vriendschappelijke wedstrijd</Text>
                                <Text style={styles.optionDesc}>
                                    Geen invloed op ranking
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View>
                        <Text style={styles.sectionTitle}>
                            Selecteer het gender waarmee je wilt spelen
                        </Text>

                        {[
                            { key: "all", title: "Alle spelers", desc: "Alle spelers kunnen meedoen" },
                            { key: "mixed", title: "Gemengd", desc: "Een man en een vrouw per team" },
                            { key: "men", title: "Alleen mannen", desc: "Alleen mannen kunnen meedoen" },
                            { key: "women", title: "Alleen vrouwen", desc: "Alleen vrouwen kunnen meedoen" },
                        ].map((item) => (
                            <TouchableOpacity
                                key={item.key}
                                style={styles.option}
                                onPress={() => setGender(item.key)}
                            >
                                <RadioButton selected={gender === item.key} />
                                <View style={styles.optionText}>
                                    <Text style={styles.optionTitle}>{item.title}</Text>
                                    <Text style={styles.optionDesc}>{item.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottom}>

                <TouchableOpacity
                    style={[
                        styles.button,
                    ]}
                    onPress={() => {
                        router.push({
                            pathname: "/match/create/review",
                            params: {
                                clubId: clubId,
                                clubName: clubName,
                                fieldId: fieldId,
                                fieldName: fieldName,
                                date: date,
                                time: time,
                                matchType: competitive ? "competitive" : "friendly",
                                gender: gender,
                            },
                        });
                    }}
                >
                    <Text style={styles.buttonText}>wedstrijd aanmaken</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },

    closeBtn: {
        marginTop: 10,
        marginBottom: 10,
    },

    closeText: {
        fontSize: 22,
        color: "#2c3e50",
    },

    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#2c3e50",
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginTop: 20,
        marginBottom: 10,
        color: "#2c3e50",
    },

    selector: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ddd",
    },

    selectorText: {
        color: "#2c3e50",
        fontSize: 15,
    },

    option: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginVertical: 12,
    },

    optionText: {
        marginLeft: 12,
        flex: 1,
    },

    optionTitle: {
        fontSize: 16,
        color: "#2c3e50",
    },

    optionDesc: {
        fontSize: 13,
        color: "#7f8c8d",
        marginTop: 2,
        paddingTop:5
    },

    infoCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        marginVertical: 10,
    },

    infoTitle: {
        fontSize: 14,
        color: "#7f8c8d",
    },

    infoValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2c3e50",
        marginVertical: 5,
    },

    infoDesc: {
        fontSize: 12,
        color: "#7f8c8d",
    },

    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#bfbfbf",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 3,
    },

    radioOuterSeected: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#345fff",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 3,
    },

    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#345fff",
    },

    bottom: {
        paddingVertical: 12,
    },

    button: {
        backgroundColor: "#345fff",
        padding: 16,
        borderRadius: 25,
        alignItems: "center",
        margin: 20
    },

    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    daysRow: {
        marginVertical: 10,
    },

    dayBox: {
        width: 60,
        height: 70,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#ddd",
    },

    selectedDay: {
        backgroundColor: "#345fff",
    },

    dayText: {
        fontSize: 12,
        color: "#7f8c8d",
    },

    dayNumber: {
        fontSize: 16,
        fontWeight: "700",
    },

    timeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 10,
    },

    timeBox: {
        width: "30%",
        padding: 12,
        borderRadius: 10,
        margin: "1.5%",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ddd",
    },

    selectedTime: {
        backgroundColor: "#345fff",
    },

    timeText: {
        color: "#2c3e50",
        fontWeight: "600",
    },

    selectedTimeText: {
        color: "#fff",
    },
});

export default Preferences;
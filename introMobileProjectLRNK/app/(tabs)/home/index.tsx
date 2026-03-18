import React from "react";
import { View, StyleSheet, Text, Pressable, Image, ImageSourcePropType } from "react-native";
import { router } from "expo-router";

interface CustomButtonProps {
    onPress: () => void;
    imageSource: ImageSourcePropType;
    label: string;
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
    return (
        <View style={styles.screen}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.logo}>PLAYTOMIC</Text>
            </View>

            {/* MAIN CONTENT */}
            <View style={styles.card}>

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

            </View>
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
        color: "#2c3e50",
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


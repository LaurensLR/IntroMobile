import React from "react";
import {View, StyleSheet, Text, Pressable, Image, ImageSourcePropType} from "react-native";
import {router} from "expo-router";

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
    return (
        <View>
            <Text style={styles.welcomeText}>
                Welcome! Hoe voel je je vandaag?
            </Text>
            <View style={styles.container}>
                <CustomButton
                    onPress={() => router.push("/booking/booking")}
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
            <View>
                <Text style={styles.otherText}>Aanbevolen clubs voor jou</Text>
            </View>
        </View>
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
        marginTop: 35
    },
})

export default App;
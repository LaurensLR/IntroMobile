import React from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import {router} from "expo-router";

const CustomButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
    <Pressable style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
);

const App = () => {
    return (
        <View style={styles.container}>
            <CustomButton
                title = "Boek een baan"
                onPress={() => router.push("/booking/booking")} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    button: {

    },
    buttonText: {

    }
})

export default App;
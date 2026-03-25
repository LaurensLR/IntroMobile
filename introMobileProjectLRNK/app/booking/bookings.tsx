import React from "react";
import { View, StyleSheet, Text } from "react-native";

const Bookings = () => {
    return (
        <View style={styles.container}>
            <Text>alle boeking</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})

export default Bookings;
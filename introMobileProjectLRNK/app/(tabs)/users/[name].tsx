import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View, StyleSheet, Text } from "react-native";

const User = () => {
    const { name } = useLocalSearchParams<{name: string}>();
    return (
        <View style={styles.container}>
            <Text>User : { name }</Text>
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

export default User;
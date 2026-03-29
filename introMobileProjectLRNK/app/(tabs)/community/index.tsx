import React from "react";
import {View, Text, Pressable, StyleSheet} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {router} from "expo-router";

const Community = () => {
    return (
        <View style={{ flex: 1 }}>

            {/* HEADER */}
            <View style={styles.header}>

                <Pressable
                    onPress={() => router.push("/community/searchUsers")}
                    style={{ flex: 1 }}
                >
                    <View style={styles.searchContainer} pointerEvents="none">
                        <Ionicons name="search" size={18} color="#888" />
                        <Text style={styles.placeholder}>Spelers zoeken</Text>
                    </View>
                </Pressable>

                <View style={styles.headerIcons}>
                    <Pressable onPress={() => console.log("notifications")} style={styles.iconBtn}>
                        <Ionicons name="notifications-outline" size={22} color="white" />
                    </Pressable>

                    <Pressable style={styles.iconBtn}>
                        <Ionicons name="menu" size={22} color="white" />
                    </Pressable>
                </View>

            </View>

            {/* CONTENT */}
            <View style={{ flex: 1 }}>
                {/* hier komt je feed */}
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#335fff",
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        gap: 12
    },

    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eee",
        borderRadius: 30,
        paddingHorizontal: 16,
        paddingVertical: 10
    },

    placeholder: {
        marginLeft: 8,
        color: "#666"
    },

    headerIcons: {
        flexDirection: "row",
        gap: 12
    },

    iconBtn: {
        padding: 6
    }
});

export default Community;
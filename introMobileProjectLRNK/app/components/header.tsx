import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type Props = {
    title: string;
    showBack?: boolean;
    onBackPress?: () => void;
};

export default function Header({ title, showBack = true, onBackPress }: Props) {
    return (
        <View style={styles.header}>

            {showBack ? (
                <Pressable onPress={() => (onBackPress ? onBackPress() : router.back())} style={styles.side}>
                    <Ionicons name="chevron-back" size={24} color="#0f2a3d" />
                </Pressable>
            ) : (
                <View style={styles.side} />
            )}

            <Text style={styles.headerTitle}>{title}</Text>

            <View style={styles.side} />

        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 70,
        paddingBottom: 12,
        paddingHorizontal: 16,
    },

    headerTitle: {
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
        color: "#0f2a3d"
    },

    side: {
        width: 40,
        alignItems: "flex-start"
    },
});
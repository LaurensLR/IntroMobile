import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

type UserCardProps = {
    id: string;
    username: string;
    level?: string;
};

export const getInitials = (name: string) =>
    name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

const UserCard = ({ id, username, level }: UserCardProps) => {
    return (
        <Pressable
            style={styles.userCard}
            onPress={() =>
                router.push({
                    pathname: "/users/[userId]",
                    params: { userId: id },
                })
            }
        >
            <View style={styles.userRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {getInitials(username)}
                    </Text>
                </View>

                <View>
                    <Text style={styles.username}>{username}</Text>
                    {level && <Text style={styles.level}>{level}</Text>}
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    userCard: {
        backgroundColor: "white",
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#345fff",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: "white",
        fontWeight: "bold",
    },
    username: {
        fontWeight: "600",
    },
    level: {
        color: "#666",
        fontSize: 12,
    },
});

export default UserCard;
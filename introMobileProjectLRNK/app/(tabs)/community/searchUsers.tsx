import React, { useState, useEffect } from "react";
import {View, StyleSheet, Text, TextInput, Pressable, FlatList} from "react-native";
import { collection, query, getDocs } from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import {router} from "expo-router";
import Header from "@/app/components/header";

const SearchUsers = () => {
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const q = query(collection(FIRESTORE_DB, "users"));
            const snapshot = await getDocs(q);

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setUsers(data);
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.username
            ?.toLowerCase()
            .includes(search.toLowerCase())
    );

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase();

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f6fa" }}>
            <Header title="Zoek spelers" />

            <View style={styles.container}>
                <TextInput
                    placeholder="Zoek spelers..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.input}
                    autoFocus
                />

                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        search.length >= 2 ? (
                            <Text style={{ textAlign: "center", color: "#666", marginTop: 20 }}>
                                Geen spelers gevonden
                            </Text>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.userCard}
                            onPress={() =>
                                router.push({
                                    pathname: "/users/[userId]",
                                    params: { userId: item.id }
                                })
                            }
                        >
                            <View style={styles.userRow}>

                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {getInitials(item.username)}
                                    </Text>
                                </View>

                                <View>
                                    <Text style={styles.username}>{item.username}</Text>
                                    <Text style={styles.level}>{item.level}</Text>
                                </View>

                            </View>
                        </Pressable>
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f5f6fa"
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#f5f6fa"
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: "bold"
    },

    close: {
        fontSize: 22,
        fontWeight: "bold"
    },
    input: {
        backgroundColor: "white",
        padding: 12,
        borderRadius: 10,
        marginBottom: 16
    },
    userCard: {
        backgroundColor: "white",
        padding: 12,
        borderRadius: 10,
        marginBottom: 10
    },

    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#0f2a3d",
        justifyContent: "center",
        alignItems: "center"
    },

    avatarText: {
        color: "white",
        fontWeight: "bold"
    },

    username: {
        fontWeight: "bold"
    },

    level: {
        color: "#666"
    },
});

export default SearchUsers;
import React, {useEffect, useState} from "react";
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import {addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, Timestamp} from "firebase/firestore";
import {FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";
import {getAuth} from "firebase/auth";
import {useLocalSearchParams} from "expo-router";
import Header from "@/app/components/header";
import {getInitials} from "@/app/(tabs)/profile";

const auth = getAuth();

type Message = {
    id: string;
    type: "message" | "system"
    text: string;
    senderId: string;
    senderName: string;
    createdAt: any;
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-BE", {
        day: "2-digit",
        month: "2-digit",
    });
};


const ChatScreen = () => {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const matchId = chatId;
    const user = auth.currentUser;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [username, setUsername] = useState<string>("");

    if (!user || !matchId || Array.isArray(matchId)) {
        return <Text>Fout</Text>;
    }

    useEffect(() => {
        if (!user?.uid) return;

        getDoc(doc(FIRESTORE_DB, "users", user.uid)).then((snap) => {
            if (snap.exists()) {
                setUsername(snap.data().username);
            }
        });
    }, [user]);

    useEffect(() => {
        const q = query(
            collection(FIRESTORE_DB, "matches", matchId, "messages"),
            orderBy("createdAt", "asc")
        );

        return onSnapshot(q, (snapshot) => {
            const msgs: Message[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Message, "id">),
            }));

            setMessages(msgs);
        });
    }, [matchId]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        await addDoc(
            collection(FIRESTORE_DB, "matches", matchId, "messages"),
            {
                type: "message",
                text: input,
                senderId: user.uid,
                senderName: username || "Speler",
                createdAt: Timestamp.now(),
            }
        );

        setInput("");
    };
    console.log(username)


    const renderItem = ({ item, index }: { item: Message; index: number }) => {
        const isMe = item.senderId === user.uid;

        const currentDate = item.createdAt?.toDate();
        const prevMessage = messages[index - 1];
        const prevDate = prevMessage?.createdAt?.toDate();

        const showDate =
            !prevDate ||
            formatDate(currentDate) !== formatDate(prevDate);

        const time = currentDate?.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        if (item.type === "system") {
            return (
                <View style={styles.systemContainer}>
                    <Text style={styles.systemText}>{item.text}</Text>
                </View>
            );
        }

        return (
            <View>
                {showDate && (
                    <View style={styles.dateContainer}>
                        <Text style={styles.dateText}>
                            {formatDate(currentDate)}
                        </Text>
                    </View>
                )}

                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        marginBottom: 10,
                        alignItems: "flex-end",
                        marginTop: 10,
                    }}
                >
                    {!isMe && (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {getInitials(item.senderName)}
                            </Text>
                        </View>
                    )}

                    <View style={{ maxWidth: "75%" }}>
                        {!isMe && (
                            <Text style={styles.senderName}>
                                {item.senderName}
                            </Text>
                        )}

                        <View
                            style={[
                                styles.messageContainer,
                                isMe ? styles.myMessage : styles.otherMessage,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.messageText,
                                    { color: isMe ? "white" : "black" },
                                ]}
                            >
                                {item.text}
                            </Text>

                            <Text style={styles.timeInside}>
                                {time}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Header title="Match chat" />

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 10 }}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.input,
                        { minHeight: 40, maxHeight: 120 }
                    ]}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Typ een bericht..."
                    multiline
                />

                <Pressable style={styles.sendButton} onPress={sendMessage}>
                    <Text style={{ color: "white" }}>Send</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f2f2f2",
    },

    header: {
        padding: 15,
        fontSize: 18,
        fontWeight: "bold",
        backgroundColor: "white",
    },

    messageContainer: {
        maxWidth: "100%",
        padding: 10,
        borderRadius: 15,
    },

    myMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#007aff",
    },

    otherMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#e5e5ea",
    },

    messageText: {
        color: "black",
    },

    inputContainer: {
        flexDirection: "row",
        paddingTop: 10,
        paddingBottom: 30,
        paddingHorizontal: 30,
        alignItems: "flex-end",
    },

    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        textAlignVertical: "top",
    },

    sendButton: {
        backgroundColor: "#007aff",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
    },
    senderName: {
        fontSize: 12,
        color: "#666",
        marginBottom: 2,
    },

    time: {
        fontSize: 10,
        color: "#999",
        marginTop: 2,
    },

    dateContainer: {
        alignItems: "center",
        marginVertical: 10,
    },

    dateText: {
        fontSize: 12,
        color: "#666",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    systemContainer: {
        alignItems: "center",
        marginVertical: 6,
    },

    systemText: {
        backgroundColor: "#e0e0e0",
        color: "#555",
        fontSize: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },

    avatar: {
        width: 35,
        height: 35,
        borderRadius: 20,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },

    avatarText: {
        fontWeight: "bold",
        color: "#333",
    },

    timeInside: {
        fontSize: 10,
        color: "#ccc",
        alignSelf: "flex-end",
        marginTop: 4,
    },
});

export default ChatScreen;
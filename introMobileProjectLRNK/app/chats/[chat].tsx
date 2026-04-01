import React, {useEffect, useState} from "react";
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from "react-native";
import {addDoc, collection, onSnapshot, orderBy, query, Timestamp} from "firebase/firestore";
import {FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";
import {getAuth} from "firebase/auth";
import {useLocalSearchParams} from "expo-router";
import Header from "@/app/components/header";

const auth = getAuth();

type Message = {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: any;
};

const ChatScreen = () => {
    const { chat } = useLocalSearchParams<{ chat: string }>();
    const matchId = chat;
    const user = auth.currentUser;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");

    if (!user || !matchId || Array.isArray(matchId)) {
        return <Text>Fout</Text>;
    }

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
                text: input,
                senderId: user.uid,
                senderName: user.displayName || "Speler",
                createdAt: Timestamp.now(),
            }
        );

        setInput("");
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.senderId === user.uid;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isMe ? styles.myMessage : styles.otherMessage,
                ]}
            >
                <Text style={styles.messageText}>{item.text}</Text>
            </View>
        );
    };
    console.log("chat")

    return (
        <View style={styles.container}>
            <Header title="Chat" />

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 10 }}
            />

            {/* INPUT */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Typ een bericht..."
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
        maxWidth: "70%",
        padding: 10,
        marginVertical: 5,
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
        padding: 25,
        backgroundColor: "white",
        alignItems: "center",
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 15,
        height: 40,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: "#007aff",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
    },
});

export default ChatScreen;
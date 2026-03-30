import {useEffect, useState} from 'react';
import {collection, onSnapshot, orderBy, query} from 'firebase/firestore';
import {Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import Header from "@/app/components/header";
import {getAuth} from 'firebase/auth';
import {FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";
import {useRouter} from "expo-router";
import {deleteNotification, markNotificationAsRead} from "@/src/lib/notifications";
import {formatDate, formatTime} from "@/app/(tabs)/home";
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

const auth = getAuth();
const userId = auth.currentUser?.uid;

type Notification = {
    id: string;
    title: string;
    body: string;
    read: boolean;
    createdAt?: any;
    data?: {
        bookingId?: string;
    };
};

const FieldBookingNotificationCard = ({ notification }: { notification: Notification }) => {

    const router = useRouter();

    const handlePress = async () => {
        if (!userId) return;

        if (!notification.read) {
            await markNotificationAsRead(userId, notification.id);
        }

        if (notification.data?.bookingId) {
            router.push(`/booking/${notification.data.bookingId}`);
        }

        //if (notification.data?.followingId) {
        //    router.push(`/user/${notification.data.followerId}`);
       // }
    };

    const renderRightActions = () => (
        <Pressable
            onPress={async () => {
                if (!userId) return;
                await deleteNotification(userId, notification.id);
            }}
            style={styles.deleteBox}
        >
            <Text style={styles.deleteText}>Verwijder</Text>
        </Pressable>
    );

    return (
        <Swipeable renderRightActions={renderRightActions}>
            <Pressable onPress={handlePress}>
                <View style={[
                    styles.card,
                    !notification.read && styles.unreadCard
                ]}>

                    <View style={styles.timeContainer}>
                        <Text style={styles.time}>
                            {formatDate(notification.createdAt)}
                        </Text>
                        <Text style={styles.time}>
                            {formatTime(notification.createdAt)}
                        </Text>
                    </View>

                    <View style={styles.cardContent}>
                        <Text style={styles.title}>
                            {notification.title}
                        </Text>
                        <Text style={styles.body}>
                            {notification.body}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </Swipeable>

    );
};

const NotificationScreen = () => {
    const userId = auth.currentUser?.uid;
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(FIRESTORE_DB, 'users', userId, 'notifications'),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const data: Notification[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<Notification, 'id'>)
            }));
            setNotifications(data);
        });
    }, [userId]);

    return (
        <View style={styles.container}>
            <Header title="Meldingen" />

            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        Geen meldingen
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                    {notifications.map(item => (
                        <FieldBookingNotificationCard key={item.id} notification={item} />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fb',
        paddingTop: 10
    },

    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        paddingTop: 22, // 🔥 extra ruimte voor datum/tijd
        borderRadius: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        position: "relative" // 🔥 nodig voor absolute positioning
    },

    unreadCard: {
        backgroundColor: '#e8f0ff'
    },

    cardContent: {
        flexDirection: 'column'
    },

    title: {
        fontWeight: '600',
        fontSize: 15,
        marginBottom: 4,
        color: '#1a1a1a'
    },

    body: {
        fontSize: 14,
        color: '#555'
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50
    },

    emptyText: {
        fontSize: 16,
        color: '#888'
    },
    timeContainer: {
        position: "absolute",
        top: 10,
        right: 12,
        alignItems: "flex-end"
    },

    time: {
        fontSize: 11,
        color: "#888"
    },

    deleteBox: {
        backgroundColor: "#ff3b30",
        justifyContent: "center",
        alignItems: "flex-end",
        paddingHorizontal: 20,
        marginVertical: 6,
        borderRadius: 14
    },

    deleteText: {
        color: "white",
        fontWeight: "bold"
    }
});

export default NotificationScreen;
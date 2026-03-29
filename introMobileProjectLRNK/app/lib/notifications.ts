import {addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc} from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";

export const createNotification = async ({ userId, title, body, data = {}
    }: {
    userId: string;
    title: string;
    body: string;
    data?: any;
}) => {
    await addDoc(collection(FIRESTORE_DB, "users", userId, "notifications"), {
        title,
        body,
        read: false,
        createdAt: serverTimestamp(),
        data
    });
};

export const markNotificationAsRead = async (
    userId: string,
    notificationId: string
) => {
    await updateDoc(
        doc(FIRESTORE_DB, "users", userId, "notifications", notificationId),
        {
            read: true
        }
    );
};

export const deleteNotification = async (userId: string, notificationId: string) => {
    await deleteDoc(
        doc(FIRESTORE_DB, "users", userId, "notifications", notificationId)
    );
};
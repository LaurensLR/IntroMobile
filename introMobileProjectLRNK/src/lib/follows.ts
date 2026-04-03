import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import {createNotification} from "@/src/lib/notifications";

export const followUser = async (
    currentUserId: string,
    targetUserId: string,
    currentUsername: string,
    targetUsername: string
) => {
    if (currentUserId === targetUserId) return;

    try {
        await setDoc(
            doc(FIRESTORE_DB, "users", targetUserId, "followers", currentUserId),
            {
                userId: currentUserId,
                username: currentUsername,
                createdAt: serverTimestamp()
            }
        );

        await setDoc(
            doc(FIRESTORE_DB, "users", currentUserId, "following", targetUserId),
            {
                userId: targetUserId,
                username: targetUsername,
                createdAt: serverTimestamp()
            }
        );

        await createNotification({
            userId: targetUserId,
            title: "Nieuwe volger",
            body: `${currentUsername} volgt je`,
            data: {
                type: "follow",
                followerId: currentUserId
            }
        });

    } catch (error) {
        console.error("Follow error:", error);
    }
};

export const unfollowUser = async (
    currentUserId: string,
    targetUserId: string
) => {
    try {
        await deleteDoc(doc(FIRESTORE_DB, "users", targetUserId, "followers", currentUserId));
        await deleteDoc(doc(FIRESTORE_DB, "users", currentUserId, "following", targetUserId));
    } catch (error) {
        console.error("Unfollow error:", error);
    }
};
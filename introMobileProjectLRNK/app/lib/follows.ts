import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import {createNotification} from "@/app/lib/notifications";

export const followUser = async (currentUserId: string, targetUserId: string, username: string) => {

    console.log({ targetUserId: targetUserId });
    console.log({currentUserId: currentUserId});

    await setDoc(
        doc(FIRESTORE_DB, "users", targetUserId, "followers", currentUserId),
        {
            userId: currentUserId,
            username: username,
            createdAt: serverTimestamp()
        }
    );



    await setDoc(
        doc(FIRESTORE_DB, "users", currentUserId, "following", targetUserId),
        {
            userId: targetUserId,
            username: currentUserId,
            createdAt: serverTimestamp()
        }
    );

    await createNotification({
        userId: targetUserId,
        title: "Nieuwe volger",
        body: `${username} volgt je`,
        data: {
            type: "follow",
            followerId: currentUserId
        }
    });
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
    await deleteDoc(doc(FIRESTORE_DB, "users", targetUserId, "followers", currentUserId));
    await deleteDoc(doc(FIRESTORE_DB, "users", currentUserId, "following", targetUserId));
};
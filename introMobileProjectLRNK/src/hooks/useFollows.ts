import {useEffect, useState} from "react";
import {collection, onSnapshot} from "firebase/firestore";
import {FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";

export const useFollows = (userId: string) => {
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        const followersRef = collection(FIRESTORE_DB, "users", userId, "followers");
        const followingRef = collection(FIRESTORE_DB, "users", userId, "following");

        const unsubFollowers = onSnapshot(followersRef, (snap) => {
            setFollowersCount(snap.size);
        });

        const unsubFollowing = onSnapshot(followingRef, (snap) => {
            setFollowingCount(snap.size);
        });

        return () => {
            unsubFollowers();
            unsubFollowing();
        };
    }, [userId]);

    return {
        followersCount,
        followingCount
    };
};

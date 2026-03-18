import { Redirect } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { FIREBASE_AUTH } from "@/app/firebase/firebaseConfig";
import { useEffect, useState } from "react";

export default function Index() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    if (loading) return null;

    if (!user) {
        return <Redirect href="/Login/Login" />;
    }

    return <Redirect href="/(tabs)/home" />;
}
import {useEffect, useState} from "react";
import {getAuth, onAuthStateChanged, User} from "firebase/auth";

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();

        return onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    return {
        user,
        userId: user?.uid,
        loading,
        isLoggedIn: !!user
    };
};
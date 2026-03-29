import {useEffect, useState} from "react";
import {Tabs, useSegments} from 'expo-router';
import {Ionicons} from "@expo/vector-icons";
import {onAuthStateChanged, User} from "firebase/auth";
import {doc, getDoc} from "firebase/firestore";
import {FIREBASE_AUTH, FIRESTORE_DB} from "@/app/lib/firebase/firebaseConfig";

const HomeLayout = () => {
    const [tabsVisible, setTabsVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const segments = useSegments() as string[];
    const currentRoute = segments[segments.length - 1];

    const mainTabs = ["home", "community", "profile"];

    const hideTabBar = !mainTabs.includes(currentRoute);

    const hiddenTabBar = { display: "none" as const };

    useEffect(() => {
        return onAuthStateChanged(FIREBASE_AUTH, (user) => {
            setCurrentUser(user);
            if (!user) setTabsVisible(false);
        });
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setTabsVisible(false);
            return;
        }

        getDoc(doc(FIRESTORE_DB, "users", currentUser.uid)).then((snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setTabsVisible(!!(data.sport && data.level));
            } else {
                setTabsVisible(false);
            }
        });
    }, [currentUser]);

    return (
        <Tabs
            screenOptions={{
                tabBarStyle: (!tabsVisible || hideTabBar)
                    ? hiddenTabBar
                    : undefined
            }}
        >
            <Tabs.Screen
                name="home/index"
                options={{
                    headerShown: false,
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="community"
                options={{
                    headerShown: false,
                    title: "Community",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    headerShown: false,
                    title: "Profiel",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
};

export default HomeLayout;
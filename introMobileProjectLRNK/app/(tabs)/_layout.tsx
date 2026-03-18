import { useEffect, useState } from "react";
import {Tabs, usePathname, useSegments} from 'expo-router';
import { FontAwesome } from "@expo/vector-icons";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE_DB } from "@/app/firebase/firebaseConfig";

const RootLayout = () => {
    const [tabsVisible, setTabsVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const pathname = usePathname();
    const segments = useSegments() as string[];
    const hideTabBar = ["booking", "booking"].some((r) =>
        segments.includes(r)
    );

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
            setCurrentUser(user);
            if (!user) setTabsVisible(false);
        });
        return unsubscribe;
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
    }, [currentUser, pathname]);

    const hiddenTabBar = { display: "none" as const };

    return (
        <Tabs screenOptions={{ tabBarStyle: tabsVisible ? undefined : hiddenTabBar}}>
            <Tabs.Screen
                name="home/index"
                options={{
                    title: "home",
                    headerShown: false,
                    tabBarIcon: ({color, size}) => <FontAwesome name="home" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name="community/community"
                options={{
                    title: 'Community',
                }}
            />

            <Tabs.Screen
                name="users/Profile"
                options={{
                    title: 'Profile',
                    headerShown: true,
                    tabBarIcon: ({color, size}) => <FontAwesome name="address-card" size={size} color={color} />
                }}
            />
            <Tabs.Screen name="users/[name]" options={{href: null}}/>
            </Tabs>
    );
}

export default RootLayout;
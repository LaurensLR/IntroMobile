import { Stack } from 'expo-router';

const RootLayout = () => {
    return (
        <Stack screenOptions={{headerShown: false}}>

            <Stack.Screen name="(tabs)" options={{title: "home", headerShown: false}}></Stack.Screen>
            <Stack.Screen name="clubs/index" options={{title: "clubs", headerShown: true}}></Stack.Screen>
            <Stack.Screen name="clubs/[clubId]" options={{title: "", headerShown: true}}></Stack.Screen>
            <Stack.Screen name="Login/Login"/>
            <Stack.Screen name="firebase/firebaseConfig"/>
            <Stack.Screen name="booking/booking" options={{title: "booking", headerShown: true}}></Stack.Screen>
            <Stack.Screen name="booking/bookingConfirmation"/>

        </Stack>
    )
};
        <Tabs screenOptions={{ tabBarStyle: tabsVisible ? undefined : hiddenTabBar }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'home',
                    headerTitle: "Playtomic",
                    headerTitleAlign: "left",
                    headerStyle: {
                        backgroundColor: "#345fff",
                    },
                    headerTintColor: "#fff",
                    headerTitleStyle: {
                        fontWeight: "bold",
                        fontSize: 30,
                    },
                    tabBarIcon: ({color, size}) => <FontAwesome name="home" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name="Community/Community"
                options={{
                    headerTitle: 'Community',
                    title: "Community"
                }}
            />
            <Tabs.Screen
                name="users/[name]"
                options={{
                    href: null
                }}
            />
            <Tabs.Screen
                name="users/Profile"
                options={{
                    headerTitle: 'Profile',
                    title: "Profile",
                    tabBarIcon: ({color, size}) => <FontAwesome name="address-card" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name="booking/booking"
                options={{ 
                    headerTitle: "Booking",
                    href: null }}
            />
            <Tabs.Screen
                name="Club/ClubList"
                options={{
                    href: null,
                    headerTitle: "Zoek een baan",
                    headerStyle: { backgroundColor: "#345fff" },
                    headerTintColor: "#fff",
                    headerTitleStyle: { fontWeight: "bold", fontSize: 24 },
                }}
            />
            <Tabs.Screen
                name="Club/ClubCard"
                options={{
                    href: null,
                    headerTitle: "Zoek een baan",
                    headerStyle: { backgroundColor: "#345fff" },
                    headerTintColor: "#fff",
                    headerTitleStyle: { fontWeight: "bold", fontSize: 24 },
                }}
            />
            <Tabs.Screen
                name="Club/[club_id]"
                options={{
                    href: null,
                    headerTitle: "Club Details",
                    headerStyle: { backgroundColor: "#345fff" },
                    headerTintColor: "#fff",
                    headerTitleStyle: { fontWeight: "bold", fontSize: 24 },
                }}
            />
            <Tabs.Screen
                name="Login/Login"
                options={{
                    headerTitle: "Login",
                    href: null }}
            />
            <Tabs.Screen
                name="firebase/firebaseConfig"
                options={{ href: null }}
            />
        </Tabs>
    );
}

export default RootLayout;
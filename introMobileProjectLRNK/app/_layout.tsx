import {Stack, Tabs} from 'expo-router';
import {FontAwesome} from "@expo/vector-icons";

const RootLayout = () => {
    return (
        <Tabs>
            <Tabs.Screen
                // Name of the dynamic route.
                name="home/home"
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
                // Name of the dynamic route.
                name="Community/Community"
                options={{
                    title: 'Community',
                   }}
            />
            <Tabs.Screen
                // Name of the dynamic route.
                name="users/[name]"
                options={{
                    href: null
                }}
            />
            <Tabs.Screen
                // Name of the dynamic route.
                name="users/Profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({color, size}) => <FontAwesome name="address-card" size={size} color={color} />
                }}
            />
            <Tabs.Screen
                // Name of the dynamic route.
                name="booking/booking"
                options={{
                    href: null
                }}
            />
        </Tabs>
    );
}

export default RootLayout;
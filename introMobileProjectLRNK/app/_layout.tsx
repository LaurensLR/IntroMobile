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

export default RootLayout;
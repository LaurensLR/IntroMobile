import { Stack } from "expo-router";

export default function BookingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="bookingScreen" />
            <Stack.Screen name="bookings" />
            <Stack.Screen name="[booking]" />
        </Stack>
    );
}
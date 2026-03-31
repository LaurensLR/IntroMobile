import { Stack } from "expo-router";

export default function MatchLayout() {
    return (
        <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="matchScreen1" />
            <Stack.Screen name="matchScreen2" />
            <Stack.Screen name="matchDetail" />
            <Stack.Screen name="[matchId]" />
            <Stack.Screen name="joinPayment" />
            <Stack.Screen name="searchMatches" />
            <Stack.Screen name="MatchConfirmation" />
        </Stack>
    );
}
import { Stack } from "expo-router";
import clubId from "@/app/clubs/[clubId]";
import {useState} from "react";
import {Club} from "@/app/clubs/clubs";

export default function ClubsLayout() {
    const [club, setClub] = useState<Club>();

    return (
        <Stack screenOptions={{headerTitle: "Clubs", headerShown: true}}>
            <Stack.Screen
                name="clubs"
            />
            <Stack.Screen
                name="[clubId]"
                options={{ headerShown: true, }}
            />
        </Stack>
    );
}
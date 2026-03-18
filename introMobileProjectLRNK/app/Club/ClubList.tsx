import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import clubsData from "../../clubs.json";
import ClubCard, { Club } from "./ClubCard";

const ClubList = () => {
    const clubs: Club[] = clubsData.clubs;

    return (
        <View style={styles.container}>
            <FlatList
                data={clubs}
                keyExtractor={(item) => item.club_id.toString()}
                renderItem={({ item }) => <ClubCard club={item} />}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    list: {
        padding: 16,
        gap: 12,
    },
});

export default ClubList;

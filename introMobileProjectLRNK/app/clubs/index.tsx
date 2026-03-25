import React, {useEffect, useState} from "react";
import {View, Text, TextInput, StyleSheet, Image, ScrollView, Dimensions, Pressable} from 'react-native';
import {FIRESTORE_DB} from "@/app/firebase/firebaseConfig";
import {collection, getDocs} from "@firebase/firestore";
import {router} from "expo-router";


export type Club = {
    id: string;
    name: string;
    street?: string;
    number?: string;
    zipcode?: string;
    city?: string;
    province?: string;
    country?: string;
    club_image?: string;
};


const SearchClub: React.FC = () => {
    const [search, setSearch] = useState("");
    const [clubs, setClubs] = useState<Club[]>([]);
    const [filteredData, setFilteredData] = useState<Club[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const clubSnapshot = await getDocs(collection(FIRESTORE_DB, "clubs"));
                const clubList: Club[] = clubSnapshot.docs
                    .map((doc) => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            name: data.name,
                            street: data.street,
                            number: data.number,
                            zipcode: data.zipcode,
                            city: data.city,
                            club_image: data.club_image,
                        };
                    })
                    .sort((a, b) => a.name.localeCompare(b.name));

                setClubs(clubList);
                setFilteredData(clubList);
            } catch (error) {
                console.error("Error fetching clubs:", error);
            }
        };
        fetchData();
    }, []);

    const handleSearch = (text: string) => {
        setSearch(text);
        const filtered = clubs.filter((item) =>
            item.name.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredData(filtered);
    };

    return (
        <View style={styles.container}>
            {/* SEARCH */}
            <TextInput
                style={styles.searchBar}
                placeholder=" Zoek een club..."
                placeholderTextColor="#95a5a6"
                value={search}
                onChangeText={handleSearch}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {filteredData.map((club) => (
                    <Pressable
                        key={club.id}
                        onPress={() =>
                            router.push({
                                pathname: "/clubs/[clubId]",
                                params: { clubId: club.id },
                            })
                        }
                        style={styles.card}
                    >
                        <Image
                            source={{ uri: club.club_image }}
                            style={styles.image}
                        />

                        <View style={styles.cardContent}>
                            <Text style={styles.clubName}>{club.name}</Text>

                            <Text style={styles.clubAddress}>
                                {club.street} {club.number}
                            </Text>
                            <Text style={styles.clubAddress}>
                                {club.zipcode} {club.city}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f6fa",
        paddingHorizontal: 16,
        paddingTop: 10,
    },

    /* SEARCH BAR */
    searchBar: {
        height: 48,
        borderRadius: 14,
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        fontSize: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    /* CARD */
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        marginBottom: 18,
        overflow: "hidden",

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },

    image: {
        width: "100%",
        height: 170,
        resizeMode: "cover",
    },

    cardContent: {
        padding: 14,
    },

    clubName: {
        fontSize: 17,
        fontWeight: "700",
        color: "#2c3e50",
        marginBottom: 6,
    },

    clubAddress: {
        fontSize: 13,
        color: "#7f8c8d",
    },
});

export default SearchClub;
import React, {useEffect, useState} from "react";
import {View, Text, TextInput, StyleSheet, Image, ScrollView, Dimensions, Pressable} from 'react-native';
import {FIRESTORE_DB} from "@/app/firebase/firebaseConfig";
import {collection, getDocs} from "@firebase/firestore";
import {router} from "expo-router";


export interface Club {
    id: string;
    name: string;
    street?: string;
    number?: string;
    zipcode?: string;
    city?: string;
    province?: string;
    country?: string;
    club_image?: string;
}

const searchClub: React.FC = () => {
    const [search, setSearch] = useState('');
    const [clubs, setClubs] = useState<Club[]>([]);
    const [filteredData, setFilteredData] = useState<Club[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const clubSnapshot = await getDocs(collection(FIRESTORE_DB, "clubs"));
                const clubList: Club[] = clubSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name,
                        street: data.street,
                        number: data.number,
                        zipcode: data.zipcode,
                        city: data.city,
                        club_image: data.club_image
                    };
                });
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
        const filtered = clubs.filter(item =>
            item.name.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredData(filtered);
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="Search here..."
                value={search}
                onChangeText={handleSearch}
            />
            <ScrollView>
                {filteredData.map((club) => (
                    <Pressable
                        key={club.id}
                        onPress={() => router.push({ pathname: "/clubs/[clubId]", params: { clubId: club.id } })}
                        style={styles.clubCard}
                    >
                        <Image
                            source={{ uri: club.club_image }}
                            style={styles.clubImage}
                        />
                        <View>
                            <Text style={styles.clubName}>{club.name}</Text>
                            <Text style={styles.clubAddress}>
                                {club.street} {club.number}, {club.zipcode} {club.city}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const screenHeight = Dimensions.get("window").height;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    searchBar: {
        height: 40,
        marginBottom: 10,
        borderRadius: 25,
        backgroundColor: "#ffff",
        paddingHorizontal: 20,
        paddingVertical: 5, // ipv padding: 20
    },
    clubCard: {
        width: "100%",
        height: screenHeight / 4,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#ffff",
        marginBottom: 20,
    },
    clubImage: {
        width: "100%",      // past twee per rij
        height: 150,
        marginBottom: 10,
        resizeMode: "cover",
    },
    clubInfo: {
        padding: 10,

    },
    clubName: {
        fontSize: 15,
        fontWeight: "bold",
    },
    clubAddress: {
        fontSize: 10,

    }

});

export default searchClub;
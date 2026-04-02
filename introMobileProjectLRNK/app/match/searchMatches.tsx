import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { router } from "expo-router";
import Header from "@/app/components/header";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";

type MatchPlayer = {
    id: string;
    name: string;
    rank?: number;
};

type MatchItem = {
    id: string;
    clubId: string;
    clubName: string;
    start: Timestamp;
    end: Timestamp;
    matchType: "competitive" | "friendly";
    gender?: "all" | "men" | "women" | "mixed";
    levelRange?: {
        min: number;
        max: number;
    };
    players?: MatchPlayer[];
    teams?: {
        team1?: string[];
        team2?: string[];
    };
    status: "open" | "full" | "finished";
    pricePerPlayer?: number;
};

type ClubAddress = {
    name?: string;
    street?: string;
    number?: string;
    zipcode?: string;
    city?: string;
};

type UserProfile = {
    username?: string;
    photoURL?: string;
    avatarUrl?: string;
    profileImage?: string;
};

type ResolvedPlayer = {
    name: string;
    imageUrl?: string;
    isOpenSpot?: boolean;
};

const formatDateTime = (start: Timestamp, end: Timestamp) => {
    const startDate = start.toDate();
    const endDate = end.toDate();

    const date = startDate.toLocaleDateString("nl-BE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const startTime = startDate.toLocaleTimeString("nl-BE", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const endTime = endDate.toLocaleTimeString("nl-BE", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return `${date}  ${startTime} - ${endTime}`;
};

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((piece) => piece[0]?.toUpperCase() || "")
        .join("") || "?";

const TeamPlayer = ({ name, imageUrl, isOpenSpot }: ResolvedPlayer) => (
    <View style={styles.teamPlayerItem}>
        {isOpenSpot ? (
            <View style={styles.openSpotAvatar}>
                <View style={styles.plusShape}>
                    <View style={styles.plusHorizontal} />
                    <View style={styles.plusVertical} />
                </View>
            </View>
        ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
        ) : (
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(name)}</Text>
            </View>
        )}
        <Text numberOfLines={1} style={styles.playerName}>{isOpenSpot ? "" : name}</Text>
    </View>
);

type LevelFilter = {
    key: string;
    label: string;
    min?: number;
    max?: number;
};

type TimeFilter = "any" | "morning" | "afternoon" | "evening";
type DateFilter = "any" | "today" | "next7";
type TypeFilter = "all" | "competitive" | "friendly";
type GenderFilter = "all" | "mixed" | "men" | "women";

const LEVEL_FILTERS: LevelFilter[] = [
    { key: "any", label: "Alle niveaus" },
    { key: "low", label: "0.25 - 1.0", min: 0.25, max: 1.0 },
    { key: "mid", label: "1.0 - 1.75", min: 1.0, max: 1.75 },
    { key: "high", label: "1.75 - 2.5", min: 1.75, max: 2.5 },
];

const SearchMatches = () => {
    const [matches, setMatches] = useState<MatchItem[]>([]);
    const [clubAddresses, setClubAddresses] = useState<Record<string, ClubAddress>>({});
    const [usersById, setUsersById] = useState<Record<string, UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [selectedLevel, setSelectedLevel] = useState("any");
    const [selectedDate, setSelectedDate] = useState<DateFilter>("any");
    const [selectedTime, setSelectedTime] = useState<TimeFilter>("any");
    const [selectedLocation, setSelectedLocation] = useState("all");
    const [selectedGender, setSelectedGender] = useState<GenderFilter>("all");
    const [selectedType, setSelectedType] = useState<TypeFilter>("all");
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const matchesQuery = query(
                    collection(FIRESTORE_DB, "matches"),
                    where("status", "==", "open")
                );

                const [matchesSnapshot, clubsSnapshot, usersSnapshot] = await Promise.all([
                    getDocs(matchesQuery),
                    getDocs(collection(FIRESTORE_DB, "clubs")),
                    getDocs(collection(FIRESTORE_DB, "users")),
                ]);

                const now = Date.now();

                const availableMatches = matchesSnapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...(doc.data() as Omit<MatchItem, "id">),
                    }))
                    .filter((match) => {
                        if (!match.end?.toDate) return false;
                        return match.end.toDate().getTime() >= now;
                    })
                    .sort((a, b) => a.start.toDate().getTime() - b.start.toDate().getTime());

                const clubMap: Record<string, ClubAddress> = {};
                clubsSnapshot.docs.forEach((doc) => {
                    clubMap[doc.id] = doc.data() as ClubAddress;
                });

                const usersMap: Record<string, UserProfile> = {};
                usersSnapshot.docs.forEach((doc) => {
                    usersMap[doc.id] = doc.data() as UserProfile;
                });

                setMatches(availableMatches);
                setClubAddresses(clubMap);
                setUsersById(usersMap);
            } catch (error) {
                console.log("Error fetching available matches:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const locationOptions = useMemo(() => {
        const cities = Object.values(clubAddresses)
            .map((club) => club.city)
            .filter((city): city is string => Boolean(city))
            .map((city) => city.trim())
            .filter(Boolean);

        const uniqueCities = Array.from(new Set(cities)).sort((a, b) => a.localeCompare(b));

        return [
            { key: "all", label: "Alle locaties" },
            ...uniqueCities.map((city) => ({ key: city, label: city })),
        ];
    }, [clubAddresses]);

    const filteredMatches = useMemo(() => {
        const levelFilter = LEVEL_FILTERS.find((filter) => filter.key === selectedLevel);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const next7End = new Date(todayStart);
        next7End.setDate(next7End.getDate() + 7);

        return matches.filter((match) => {
            const start = match.start?.toDate?.();
            if (!start) return false;

            if (selectedDate === "today") {
                if (start < todayStart || start > todayEnd) return false;
            }

            if (selectedDate === "next7") {
                if (start < todayStart || start > next7End) return false;
            }

            if (selectedTime !== "any") {
                const hour = start.getHours();
                if (selectedTime === "morning" && (hour < 6 || hour >= 12)) return false;
                if (selectedTime === "afternoon" && (hour < 12 || hour >= 18)) return false;
                if (selectedTime === "evening" && (hour < 18 || hour >= 23)) return false;
            }

            if (selectedType !== "all" && match.matchType !== selectedType) return false;

            if (selectedGender !== "all") {
                const matchGender = match.gender ?? "all";
                if (matchGender !== selectedGender) return false;
            }

            if (selectedLocation !== "all") {
                const clubCity = clubAddresses[match.clubId]?.city?.trim();
                if (!clubCity || clubCity !== selectedLocation) return false;
            }

            if (levelFilter && levelFilter.min !== undefined && levelFilter.max !== undefined) {
                const levelMin = match.levelRange?.min ?? 0.25;
                const levelMax = match.levelRange?.max ?? 2.5;
                if (levelMax < levelFilter.min || levelMin > levelFilter.max) return false;
            }

            return true;
        });
    }, [
        matches,
        clubAddresses,
        selectedDate,
        selectedTime,
        selectedType,
        selectedGender,
        selectedLocation,
        selectedLevel,
    ]);

    const renderCard = ({ item }: { item: MatchItem }) => {
        const players = item.players || [];
        const team1 = item.teams?.team1 || [];
        const team2 = item.teams?.team2 || [];

        const playersById = new Map<string, MatchPlayer>();
        players.forEach((player) => playersById.set(player.id, player));

        const resolvePlayer = (playerId: string | undefined, index: number): ResolvedPlayer => {
            if (!playerId) {
                return {
                    name: "+",
                    isOpenSpot: true,
                };
            }

            const fromMatch = playersById.get(playerId);
            const fromUser = usersById[playerId];
            const name = fromUser?.username || fromMatch?.name || `Player ${index + 1}`;
            const imageUrl = fromUser?.photoURL || fromUser?.avatarUrl || fromUser?.profileImage;

            return { name, imageUrl };
        };

        const team1Players = [0, 1].map((index) => {
            const playerId = team1[index];
            return resolvePlayer(playerId, index);
        });

        const team2Players = [0, 1].map((index) => {
            const playerId = team2[index];
            return resolvePlayer(playerId, index);
        });

        const club = clubAddresses[item.clubId] || {};
        const clubLabel = club.name || item.clubName || "Onbekende club";
        const address = [club.street, club.number, club.zipcode, club.city]
            .filter(Boolean)
            .join(" ");

        const levelMin = item.levelRange?.min ?? 0.25;
        const levelMax = item.levelRange?.max ?? 1.25;
        const matchTypeLabel = item.matchType === "competitive" ? "Competitief" : "Vriendschappelijk";
        const price = item.pricePerPlayer ?? 12;

        return (
            <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
                onPress={() =>
                    router.push({
                        pathname: "/match/[matchId]",
                        params: { matchId: item.id },
                    } as any)
                }
            >
                <View style={styles.topRow}>
                    <Text style={styles.dateTime}>{formatDateTime(item.start, item.end)}</Text>
                    <View style={styles.tagsRow}>
                        <View style={styles.typeTag}>
                            <Text style={styles.typeTagText}>{matchTypeLabel}</Text>
                        </View>
                        <Text style={styles.levelText}>{`${levelMin.toFixed(2)} - ${levelMax.toFixed(2)}`}</Text>
                    </View>
                </View>

                <View style={styles.teamsRow}>
                    <View style={styles.teamColumn}>
                        {team1Players.map((player, index) => (
                            <TeamPlayer
                                key={`${item.id}-team1-${index}`}
                                name={player.name}
                                imageUrl={player.imageUrl}
                                isOpenSpot={player.isOpenSpot}
                            />
                        ))}
                    </View>

                    <View style={styles.verticalDivider} />

                    <View style={styles.teamColumn}>
                        {team2Players.map((player, index) => (
                            <TeamPlayer
                                key={`${item.id}-team2-${index}`}
                                name={player.name}
                                imageUrl={player.imageUrl}
                                isOpenSpot={player.isOpenSpot}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.bottomRow}>
                    <View style={styles.clubBlock}>
                        <Text style={styles.clubName}>{clubLabel}</Text>
                        <Text style={styles.clubAddress} numberOfLines={1}>
                            {address || "Adres niet beschikbaar"}
                        </Text>
                    </View>

                    <Text style={styles.priceText}>{`EUR ${price} p.p.`}</Text>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.screen}>
            <Header title="Beschikbare matches" />

            {loading ? (
                <ActivityIndicator size="large" color="#345fff" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredMatches}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.filtersCard}>
                            <Pressable
                                style={styles.filtersHeader}
                                onPress={() => setFiltersOpen((prev) => !prev)}
                            >
                                <View>
                                    <Text style={styles.filtersTitle}>Filters</Text>
                                    <Text style={styles.filtersCount}>{`${filteredMatches.length} resultaten`}</Text>
                                </View>
                                <Text style={styles.filtersToggle}>{filtersOpen ? "Verbergen" : "Tonen"}</Text>
                            </Pressable>

                            {filtersOpen && (
                                <View>
                                    <Text style={styles.filtersLabel}>Niveau</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                                        {LEVEL_FILTERS.map((option) => (
                                            <Pressable
                                                key={option.key}
                                                onPress={() => setSelectedLevel(option.key)}
                                                style={[
                                                    styles.filterChip,
                                                    selectedLevel === option.key && styles.filterChipActive,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.filterChipText,
                                                        selectedLevel === option.key && styles.filterChipTextActive,
                                                    ]}
                                                >
                                                    {option.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>

                                    <Text style={styles.filtersLabel}>Datum</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                                        {[
                                            { key: "any", label: "Alle datums" },
                                            { key: "today", label: "Vandaag" },
                                            { key: "next7", label: "Volgende 7 dagen" },
                                        ].map((option) => (
                                            <Pressable
                                                key={option.key}
                                                onPress={() => setSelectedDate(option.key as DateFilter)}
                                                style={[
                                                    styles.filterChip,
                                                    selectedDate === option.key && styles.filterChipActive,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.filterChipText,
                                                        selectedDate === option.key && styles.filterChipTextActive,
                                                    ]}
                                                >
                                                    {option.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>

                                    <Text style={styles.filtersLabel}>Tijd</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                                        {[
                                            { key: "any", label: "Elke tijd" },
                                            { key: "morning", label: "Ochtend" },
                                            { key: "afternoon", label: "Middag" },
                                            { key: "evening", label: "Avond" },
                                        ].map((option) => (
                                            <Pressable
                                                key={option.key}
                                                onPress={() => setSelectedTime(option.key as TimeFilter)}
                                                style={[
                                                    styles.filterChip,
                                                    selectedTime === option.key && styles.filterChipActive,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.filterChipText,
                                                        selectedTime === option.key && styles.filterChipTextActive,
                                                    ]}
                                                >
                                                    {option.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>

                                    <Text style={styles.filtersLabel}>Locatie</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                                        {locationOptions.map((option) => (
                                            <Pressable
                                                key={option.key}
                                                onPress={() => setSelectedLocation(option.key)}
                                                style={[
                                                    styles.filterChip,
                                                    selectedLocation === option.key && styles.filterChipActive,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.filterChipText,
                                                        selectedLocation === option.key && styles.filterChipTextActive,
                                                    ]}
                                                >
                                                    {option.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>

                                    <Text style={styles.filtersLabel}>Matchtype</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                                        {[
                                            { key: "all", label: "Alle types" },
                                            { key: "competitive", label: "Competitief" },
                                            { key: "friendly", label: "Vriendschappelijk" },
                                        ].map((option) => (
                                            <Pressable
                                                key={option.key}
                                                onPress={() => setSelectedType(option.key as TypeFilter)}
                                                style={[
                                                    styles.filterChip,
                                                    selectedType === option.key && styles.filterChipActive,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.filterChipText,
                                                        selectedType === option.key && styles.filterChipTextActive,
                                                    ]}
                                                >
                                                    {option.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>

                                    <Text style={styles.filtersLabel}>Gender</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                                        {[
                                            { key: "all", label: "Alle spelers" },
                                            { key: "mixed", label: "Gemengd" },
                                            { key: "men", label: "Mannen" },
                                            { key: "women", label: "Vrouwen" },
                                        ].map((option) => (
                                            <Pressable
                                                key={option.key}
                                                onPress={() => setSelectedGender(option.key as GenderFilter)}
                                                style={[
                                                    styles.filterChip,
                                                    selectedGender === option.key && styles.filterChipActive,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.filterChipText,
                                                        selectedGender === option.key && styles.filterChipTextActive,
                                                    ]}
                                                >
                                                    {option.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Geen matches die overeenkomen met je filters.</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f5f6fa",
    },
    listContent: {
        padding: 16,
        paddingBottom: 28,
    },
    loader: {
        marginTop: 40,
    },
    emptyText: {
        marginTop: 24,
        textAlign: "center",
        color: "#7f8c8d",
        fontSize: 15,
    },
    filtersCard: {
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    filtersHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    filtersTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#0f2a3d",
    },
    filtersCount: {
        fontSize: 12,
        fontWeight: "600",
        color: "#7f8c8d",
    },
    filtersToggle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#345fff",
    },
    filtersLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#2c3e50",
        marginTop: 10,
        marginBottom: 6,
    },
    filtersRow: {
        paddingBottom: 6,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#dfe6e9",
        backgroundColor: "#f7f9fc",
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: "#0f2a3d",
        borderColor: "#0f2a3d",
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#2c3e50",
    },
    filterChipTextActive: {
        color: "#ffffff",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    topRow: {
        marginBottom: 12,
    },
    dateTime: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2c3e50",
        marginBottom: 8,
    },
    tagsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    typeTag: {
        backgroundColor: "#ecf1ff",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    typeTagText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#345fff",
    },
    levelText: {
        fontSize: 12,
        color: "#2c3e50",
        fontWeight: "600",
    },
    teamsRow: {
        flexDirection: "row",
        alignItems: "stretch",
        marginBottom: 14,
    },
    teamColumn: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    verticalDivider: {
        width: 1,
        backgroundColor: "#dfe6e9",
        marginHorizontal: 12,
    },
    teamPlayerItem: {
        width: "48%",
        alignItems: "center",
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#0f2a3d",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarImage: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#dfe6e9",
    },
    openSpotAvatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#345fff",
        backgroundColor: "#ecf1ff",
        alignItems: "center",
        justifyContent: "center",
    },
    plusShape: {
        width: 50,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    plusHorizontal: {
        position: "absolute",
        width: 44,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#345fff",
    },
    plusVertical: {
        position: "absolute",
        width: 8,
        height: 44,
        borderRadius: 4,
        backgroundColor: "#345fff",
    },
    avatarText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
    },
    playerName: {
        marginTop: 6,
        fontSize: 12,
        color: "#2c3e50",
        textAlign: "center",
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
    },
    clubBlock: {
        flex: 1,
        marginRight: 8,
    },
    clubName: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2c3e50",
    },
    clubAddress: {
        fontSize: 12,
        color: "#7f8c8d",
        marginTop: 2,
    },
    priceText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2c3e50",
    },
});

export default SearchMatches;
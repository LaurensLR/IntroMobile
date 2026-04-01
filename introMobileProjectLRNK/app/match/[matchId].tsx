import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDoc, getDocs, Timestamp } from "firebase/firestore";
import { router, useLocalSearchParams } from "expo-router";
import { FIRESTORE_DB } from "@/app/lib/firebase/firebaseConfig";
import { getAuth } from "firebase/auth";

type MatchPlayer = {
    id: string;
    name: string;
    rank?: number;
};

type MatchItem = {
    id: string;
    clubId: string;
    clubName: string;
    fieldName?: string;
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
    club_image?: string;
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
    canJoin?: boolean;
    isDisabled?: boolean;
    teamKey?: "team1" | "team2";
    slotIndex?: 0 | 1;
};

const asString = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

const formatLongDateTime = (start: Timestamp, end: Timestamp) => {
    const startDate = start.toDate();
    const endDate = end.toDate();

    const weekday = startDate.toLocaleDateString("nl-BE", { weekday: "long" });
    const day = startDate.toLocaleDateString("nl-BE", { day: "numeric" });
    const month = startDate.toLocaleDateString("nl-BE", { month: "long" });
    const startTime = startDate.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
    const endTime = endDate.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });

    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month} ${startTime} - ${endTime}`;
};

const formatDateOnly = (start: Timestamp) =>
    start.toDate().toLocaleDateString("nl-BE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

const formatTimeRange = (start: Timestamp, end: Timestamp) => {
    const startTime = start.toDate().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
    const endTime = end.toDate().toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
    return `${startTime} - ${endTime}`;
};

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((piece) => piece[0]?.toUpperCase() || "")
        .join("") || "?";

const TeamPlayer = ({
    name,
    imageUrl,
    isOpenSpot,
    canJoin,
    isDisabled,
    onPress,
}: ResolvedPlayer & { onPress?: () => void }) => {
    const avatarContent = isOpenSpot ? (
        <View style={[styles.openSpotAvatar, isDisabled && styles.openSpotAvatarDisabled]}>
            <View style={styles.plusShape}>
                <View style={[styles.plusHorizontal, isDisabled && styles.plusDisabled]} />
                <View style={[styles.plusVertical, isDisabled && styles.plusDisabled]} />
            </View>
        </View>
    ) : imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
    ) : (
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
    );

    return (
        <Pressable
            style={styles.teamPlayerItem}
            onPress={onPress}
            disabled={!canJoin}
        >
            {avatarContent}
            <Text numberOfLines={1} style={[styles.playerName, isDisabled && styles.playerNameDisabled]}>
                {isOpenSpot ? (isDisabled ? "" : "Inschrijven") : name}
            </Text>
        </Pressable>
    );
};



const MatchView = () => {
    const params = useLocalSearchParams();
    const matchId = asString(params.matchId);
    const from = asString(params.from);

    const [loading, setLoading] = useState(true);
    const [match, setMatch] = useState<MatchItem | null>(null);
    const [club, setClub] = useState<ClubAddress | null>(null);
    const [usersById, setUsersById] = useState<Record<string, UserProfile>>({});
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const goBack = () => {
        if (from === "payment" || !router.canGoBack()) {
            router.replace("/(tabs)/home");
            return;
        }

        router.back();
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!matchId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const matchSnap = await getDoc(doc(FIRESTORE_DB, "matches", matchId));
                if (!matchSnap.exists()) {
                    setMatch(null);
                    return;
                }

                const matchData = {
                    id: matchSnap.id,
                    ...(matchSnap.data() as Omit<MatchItem, "id">),
                };
                setMatch(matchData);

                const [clubSnap, usersCollection] = await Promise.all([
                    getDoc(doc(FIRESTORE_DB, "clubs", matchData.clubId)),
                    getDocs(collection(FIRESTORE_DB, "users")),
                ]);

                if (clubSnap.exists()) {
                    setClub(clubSnap.data() as ClubAddress);
                }

                const userMap: Record<string, UserProfile> = {};
                usersCollection.docs.forEach((userDoc) => {
                    userMap[userDoc.id] = userDoc.data() as UserProfile;
                });
                setUsersById(userMap);
            } catch (error) {
                console.log("Error loading match detail:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [matchId]);

    if (loading) {
        return (
            <View style={styles.screen}>
                <ActivityIndicator size="large" color="#345fff" style={styles.loader} />
            </View>
        );
    }

    if (!match) {
        return (
            <View style={styles.screen}>
                <View style={styles.emptyHeaderRow}>
                    <Pressable style={styles.backButton} onPress={goBack}>
                        <Ionicons name="chevron-back" size={24} color="#0f2a3d" />
                    </Pressable>
                </View>
                <Text style={styles.emptyText}>Match niet gevonden.</Text>
            </View>
        );
    }

    const playersById = new Map<string, MatchPlayer>();
    (match.players || []).forEach((player) => playersById.set(player.id, player));

    const team1Ids = match.teams?.team1 || [];
    const team2Ids = match.teams?.team2 || [];
    const currentUserId = currentUser?.uid;
    const alreadyRegistered = !!currentUserId && (
        (match.players || []).some((player) => player.id === currentUserId) ||
        team1Ids.includes(currentUserId) ||
        team2Ids.includes(currentUserId)
    );

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

    const buildTeamPlayers = (teamKey: "team1" | "team2", teamIds: string[]) =>
        [0, 1].map((index) => {
            const slotIndex = index as 0 | 1;
            const resolved = resolvePlayer(teamIds[slotIndex], slotIndex);

            if (!resolved.isOpenSpot) {
                return {
                    ...resolved,
                    canJoin: false,
                    isDisabled: false,
                    teamKey,
                    slotIndex,
                };
            }

            const blockedByOrder = slotIndex === 1 && !teamIds[0];
            const blockedByUser = alreadyRegistered;
            const blockedByStatus = match.status !== "open";
            const canJoin = !!currentUserId && !blockedByOrder && !blockedByUser && !blockedByStatus;

            return {
                ...resolved,
                canJoin,
                isDisabled: !canJoin,
                teamKey,
                slotIndex,
            };
        });

    const team1Players = buildTeamPlayers("team1", team1Ids);
    const team2Players = buildTeamPlayers("team2", team2Ids);

    const clubLabel = club?.name || match.clubName || "Onbekende club";
    const address = [club?.street, club?.number, club?.zipcode, club?.city]
        .filter(Boolean)
        .join(" ");

    const levelMin = match.levelRange?.min ?? 0.25;
    const levelMax = match.levelRange?.max ?? 1.25;
    const price = match.pricePerPlayer ?? 12;
    const genderLabel =
        match.gender === "men"
            ? "Alleen mannen"
            : match.gender === "women"
                ? "Alleen vrouwen"
                : match.gender === "mixed"
                    ? "Gemengd"
                    : "Alle spelers";

    const competeTitle = match.matchType === "competitive" ? "Concurrerend" : "Vriendschappelijk";
    const competeDesc =
        match.matchType === "competitive"
            ? "Het resultaat van deze wedstrijd telt mee voor het level"
            : "Deze wedstrijd is ontspannen en heeft geen invloed op ranking";

    return (
        <View style={styles.screen}>
            <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroWrapper}>
                    {club?.club_image ? (
                        <Image source={{ uri: club.club_image }} style={styles.heroImage} />
                    ) : (
                        <View style={styles.heroFallback} />
                    )}

                    <View style={styles.heroOverlay} />

                    <View style={styles.heroActionsRow}>
                        <Pressable style={styles.backButtonFloating} onPress={goBack}>
                            <Ionicons name="chevron-back" size={24} color="#0f2a3d" />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.summaryCard}>
                    <View style={styles.summaryTopRow}>
                        <Ionicons name="tennisball-outline" size={20} color="#4b5b6a" />
                        <View style={styles.summaryTitleWrap}>
                            <Text style={styles.summaryTitle}>PADEL</Text>
                            <Text style={styles.summaryDate}>{formatLongDateTime(match.start, match.end)}</Text>
                        </View>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.fieldsGrid}>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldLabel}>Datum</Text>
                            <Text style={styles.fieldValue}>{formatDateOnly(match.start)}</Text>
                        </View>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldLabel}>Tijd</Text>
                            <Text style={styles.fieldValue}>{formatTimeRange(match.start, match.end)}</Text>
                        </View>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldLabel}>Geslacht</Text>
                            <Text style={styles.fieldValue}>{genderLabel}</Text>
                        </View>
                        <View style={styles.fieldBox}>
                            <Text style={styles.fieldLabel}>Niveau</Text>
                            <Text style={styles.fieldValue}>{`${levelMin.toFixed(2)}-${levelMax.toFixed(2)}`}</Text>
                        </View>
                    </View>

                    <Text style={styles.priceInline}>{`Prijs: EUR ${price}`}</Text>
                </View>

                <View style={styles.competeCard}>
                    <Text style={styles.competeTitle}>{competeTitle}</Text>
                    <Text style={styles.competeDesc}>{competeDesc}</Text>
                </View>

                <View style={styles.playersCard}>
                    <View style={styles.playersTopRow}>
                        <Text style={styles.playersTitle}>Spelers</Text>
                    </View>

                    <View style={styles.teamsRow}>
                        <View style={styles.teamColumn}>
                            {team1Players.map((player, index) => (
                                <TeamPlayer
                                    key={`detail-team1-${index}`}
                                    name={player.name}
                                    imageUrl={player.imageUrl}
                                    isOpenSpot={player.isOpenSpot}
                                    canJoin={player.canJoin}
                                    isDisabled={player.isDisabled}
                                    onPress={() => {
                                        if (player.isOpenSpot && player.canJoin && player.teamKey && player.slotIndex !== undefined) {
                                            router.push({
                                                pathname: "/match/joinPayment",
                                                params: {
                                                    matchId: match.id,
                                                    teamKey: player.teamKey,
                                                    slotIndex: String(player.slotIndex),
                                                },
                                            } as any);
                                        }
                                    }}
                                />
                            ))}
                        </View>

                        <View style={styles.verticalDivider} />

                        <View style={styles.teamColumn}>
                            {team2Players.map((player, index) => (
                                <TeamPlayer
                                    key={`detail-team2-${index}`}
                                    name={player.name}
                                    imageUrl={player.imageUrl}
                                    isOpenSpot={player.isOpenSpot}
                                    canJoin={player.canJoin}
                                    isDisabled={player.isDisabled}
                                    onPress={() => {
                                        if (player.isOpenSpot && player.canJoin && player.teamKey && player.slotIndex !== undefined) {
                                            router.push({
                                                pathname: "/match/joinPayment",
                                                params: {
                                                    matchId: match.id,
                                                    teamKey: player.teamKey,
                                                    slotIndex: String(player.slotIndex),
                                                },
                                            } as any);
                                        }
                                    }}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={styles.teamLettersRow}>
                        <Text style={styles.teamLetter}>A</Text>
                        <Text style={styles.teamLetter}>B</Text>
                    </View>
                </View>

                <Pressable
                    style={styles.chatBtn}
                    onPress={() => router.push(`/chats/${matchId}`)}
                >
                    <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                    <Text style={styles.chatBtnText}>Chat</Text>
                </Pressable>

                <View style={styles.clubInfoCard}>
                    {club?.club_image ? (
                        <Image source={{ uri: club.club_image }} style={styles.clubThumb} />
                    ) : (
                        <View style={styles.clubThumbFallback} />
                    )}

                    <View style={styles.clubInfoTextWrap}>
                        <Text style={styles.clubInfoTitle}>{clubLabel}</Text>
                        <Text style={styles.clubInfoAddress} numberOfLines={1}>{address || "Adres niet beschikbaar"}</Text>
                    </View>

                </View>

                <Text style={styles.infoSectionTitle}>Informatie</Text>

                    <View style={styles.infoListCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="information-circle-outline" size={22} color="#213647" />
                            <View>
                                <Text style={styles.infoLabel}>Baannaam</Text>
                                <Text style={styles.infoValue}>{match.fieldName || "Padel 1"}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Ionicons name="grid-outline" size={22} color="#213647" />
                            <View>
                                <Text style={styles.infoLabel}>Baan type</Text>
                                <Text style={styles.infoValue}>Binnen, Panoramisch, Dubbelspel</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f0f2f5",
    },
    heroWrapper: {
        height: 248,
        position: "relative",
        backgroundColor: "#dfe6e9",
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    heroFallback: {
        width: "100%",
        height: "100%",
        backgroundColor: "#98a6b3",
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(23, 48, 89, 0.18)",
    },
    heroActionsRow: {
        position: "absolute",
        top: 58,
        left: 14,
        right: 14,
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
    },
    backButtonFloating: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyHeaderRow: {
        paddingTop: 58,
        paddingHorizontal: 14,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    content: {
        padding: 16,
        paddingTop: 12,
        paddingBottom: 36,
    },
    pageContent: {
        paddingBottom: 0,
    },
    loader: {
        marginTop: 40,
    },
    emptyText: {
        marginTop: 40,
        textAlign: "center",
        color: "#7f8c8d",
        fontSize: 15,
    },
    summaryCard: {
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
        marginBottom: 12,
    },
    summaryTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    summaryTitleWrap: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: 33,
        letterSpacing: 0.4,
        color: "#1d2f40",
        fontWeight: "800",
        lineHeight: 38,
    },
    summaryDate: {
        marginTop: 2,
        color: "#354656",
        fontSize: 17,
        fontWeight: "500",
    },
    summaryDivider: {
        marginTop: 14,
        marginBottom: 12,
        height: 1,
        backgroundColor: "#e1e5ea",
    },
    fieldsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 10,
        columnGap: 10,
    },
    fieldBox: {
        width: "48%",
        borderWidth: 1,
        borderColor: "#d9e0e7",
        borderRadius: 12,
        backgroundColor: "#f8fafc",
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    fieldLabel: {
        color: "#6d7a88",
        fontSize: 13,
        marginBottom: 5,
    },
    fieldValue: {
        color: "#1f3344",
        fontSize: 15,
        fontWeight: "700",
    },
    priceInline: {
        marginTop: 12,
        color: "#1f3344",
        fontSize: 15,
        fontWeight: "700",
    },
    chipsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    infoChip: {
        backgroundColor: "#f7f8fa",
        borderWidth: 1,
        borderColor: "#dfe3e8",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },
    infoChipText: {
        fontSize: 16,
        color: "#304353",
        fontWeight: "500",
    },
    competeCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#dfe3e8",
        marginBottom: 12,
    },
    competeTitle: {
        color: "#213647",
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 6,
    },
    competeDesc: {
        color: "#5b6978",
        fontSize: 16,
        lineHeight: 23,
    },
    playersCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#dfe3e8",
        marginBottom: 16,
    },
    playersTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    playersTitle: {
        fontSize: 21,
        fontWeight: "700",
        color: "#1d2f40",
    },
    rangeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#dfe3e8",
        backgroundColor: "#f7f8fa",
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    rangeBadgeText: {
        color: "#5b6670",
        fontSize: 15,
        fontWeight: "500",
    },
    teamsRow: {
        flexDirection: "row",
        alignItems: "stretch",
        marginBottom: 10,
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
        marginHorizontal: 14,
    },
    teamPlayerItem: {
        width: "48%",
        alignItems: "center",
    },
    avatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#0f2a3d",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarImage: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#dfe6e9",
    },
    openSpotAvatar: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 1,
        borderColor: "#cfd5db",
        backgroundColor: "#f4f6f8",
        alignItems: "center",
        justifyContent: "center",
    },
    openSpotAvatarDisabled: {
        borderColor: "#d8dde3",
        backgroundColor: "#eef1f4",
    },
    plusShape: {
        width: 30,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    plusHorizontal: {
        position: "absolute",
        width: 24,
        height: 3,
        borderRadius: 2,
        backgroundColor: "#2f64f0",
    },
    plusVertical: {
        position: "absolute",
        width: 3,
        height: 24,
        borderRadius: 2,
        backgroundColor: "#2f64f0",
    },
    plusDisabled: {
        backgroundColor: "#adb7c2",
    },
    avatarText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
    },
    playerName: {
        marginTop: 6,
        fontSize: 14,
        color: "#2c3e50",
        textAlign: "center",
    },
    playerNameDisabled: {
        color: "#9aa6b2",
    },
    teamLettersRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 2,
    },
    teamLetter: {
        color: "#576774",
        fontWeight: "800",
        fontSize: 32,
    },
    chatBtn: {
        alignSelf: "center",
        backgroundColor: "#2f64f0",
        borderRadius: 999,
        paddingHorizontal: 28,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 20,
    },
    chatBtnText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    clubInfoCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#dfe3e8",
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },
    clubThumb: {
        width: 88,
        height: 88,
        borderRadius: 8,
    },
    clubThumbFallback: {
        width: 88,
        height: 88,
        borderRadius: 8,
        backgroundColor: "#c9d1d9",
    },
    clubInfoTextWrap: {
        flex: 1,
        marginLeft: 14,
        marginRight: 8,
    },
    clubInfoTitle: {
        color: "#1e3244",
        fontSize: 19,
        fontWeight: "700",
        marginBottom: 4,
    },
    clubInfoAddress: {
        color: "#677888",
        fontSize: 15,
        marginBottom: 6,
    },
    moreInfoText: {
        color: "#2f64f0",
        fontSize: 17,
        fontWeight: "600",
    },
    navigateBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#2f64f0",
        alignItems: "center",
        justifyContent: "center",
    },
    infoSectionTitle: {
        fontSize: 36,
        fontWeight: "800",
        color: "#1a2f42",
        marginBottom: 12,
    },
    infoListCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#dfe3e8",
        padding: 14,
        gap: 18,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    infoLabel: {
        color: "#748291",
        fontSize: 18,
        marginBottom: 2,
    },
    infoValue: {
        color: "#203446",
        fontSize: 24,
        fontWeight: "500",
    },
});

export default MatchView;

import { Timestamp } from "firebase/firestore";

export type MatchPlayer = {
    id: string;
    name: string;
    rank?: number;
};

export type MatchItem = {
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

    score?: {
        sets: [number, number][],
    };
};
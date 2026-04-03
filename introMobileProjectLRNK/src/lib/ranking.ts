type InputSet = {
    team1: string;
    team2: string;
};

type SetScore = [number, number];

const isValidSet = (p: number, o: number) => {
    if (p < 0 || o < 0) return false;

    const isWin = (a: number, b: number) => {
        if (a >= 6 && a <= 7 && a - b >= 2 && b <= 4) return true;
        return a === 7 && (b === 5 || b === 6);

    };

    return isWin(p, o) || isWin(o, p);
};

const getWinner = (sets: SetScore[]) => {
    let team1Wins = 0;
    let team2Wins = 0;

    for (const [a, b] of sets) {
        if (!isValidSet(a, b)) return null;

        if (a > b) team1Wins++;
        else team2Wins++;
    }

    if (team1Wins >= 2) return "team1";
    if (team2Wins >= 2) return "team2";

    return null;
};


const getCategory = (level: number) => {
    if (level < 2) return 0; // Beginner
    if (level < 4) return 1; // Intermediate
    if (level < 6) return 2; // Advanced
    return 3; // Pro
};

const ratingMatrix = [
    [0.02, 0.03, 0.04, 0.05],
    [0.015, 0.02, 0.03, 0.04],
    [0.01, 0.015, 0.02, 0.03],
    [0.005, 0.01, 0.015, 0.02],
];


const cap = (value: number) => Math.max(-0.3, Math.min(0.3, value));


const calculateDelta = (
    playerLevel: number,
    opponent1: number,
    opponent2: number,
    didWin: boolean
) => {
    const playerCat = getCategory(playerLevel);

    const opponentAvg = (opponent1 + opponent2) / 2;
    const opponentCat = getCategory(opponentAvg);

    const base = ratingMatrix[playerCat][opponentCat];

    let delta = didWin ? base : -base;

    delta = cap(delta);

    return Number(delta.toFixed(2));
};

export {
    InputSet,
    SetScore,
    getWinner,
    isValidSet,
    calculateDelta
};
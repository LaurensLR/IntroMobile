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

const getK = (player: number, avg: number) => {
    const diff = Math.abs(player - avg);

    if (diff < 0.5) return 0.25;
    if (diff < 1.5) return 0.2;
    return 0.15;
};

const cap = (delta: number, max = 0.2) =>
    Math.max(-max, Math.min(max, delta));


const updateRating = (
    playerLevel: number,
    opponent1: number,
    opponent2: number,
    setsWon: number,
    setsLost: number,
    gamesWon: number,
    gamesLost: number
) => {
    const avg = (opponent1 + opponent2) / 2;


    const expectedRaw = 1 / (1 + 10 ** ((avg - playerLevel) / 1.5));
    const expected = Math.max(0.01, Math.min(0.99, expectedRaw));

    const totalSets = setsWon + setsLost;
    const setScore = totalSets > 0 ? setsWon / totalSets : 0;

    const totalGames = gamesWon + gamesLost;
    const gameDiff = totalGames > 0
        ? (gamesWon - gamesLost) / totalGames
        : 0;

    const scoreRaw = 0.8 * setScore + 0.2 * (0.5 + gameDiff / 2);
    const score = Math.max(0, Math.min(1, scoreRaw));

    const K = getK(playerLevel, avg);

    const delta = K * (score - expected);
    const cappedDelta = cap(delta);

    const newLevel = playerLevel + cappedDelta;

    return Number(newLevel.toFixed(3));
};

export {
    InputSet,
    SetScore,
    getWinner,
    isValidSet,
    updateRating,
    getK
};
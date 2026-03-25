// data/stage.js
export const stageSettings = {
    // 1단계 적의 기본 능력치
    initialStats: {
        hp: 150,
        atk: 30,
        def: 15
    },
    // 단계당 스탯 상승률 (0.15 = 15%씩 강해짐)
    difficultyScale: 0.15,
    // 클리어 보상금 공식 (단계 * 100)
    getReward: (stage) => stage * 100
};

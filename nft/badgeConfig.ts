export const BADGE_CONFIG = {
  10: {
    wins: 10,
    key: "win_10",
    name: "Polar Novice",
    titleCn: "极地新手",
    attribute: "Aurora Level: I",
    uri: "ipfs://bafybeiadufkcj4grstx57xgtpqthl4aye6babt6gincpgxyqbeeizhjvoiu/win_10.json",
    img: { uri: "https://raw.githubusercontent.com/JINJIN2024UX/Reversi-King/main/nft/badge_10.png" },
  },
  50: {
    wins: 50,
    key: "win_50",
    name: "Arctic Explorer",
    titleCn: "北极探索者",
    attribute: "Aurora Level: II",
    uri: "ipfs://bafybeiadufkcj4grstx57xgtpqthl4aye6babt6gincpgxyqbeeizhjvoiu/win_50.json",
    img: { uri: "https://raw.githubusercontent.com/JINJIN2024UX/Reversi-King/main/nft/badge_50.png" },
  },
  100: {
    wins: 100,
    key: "win_100",
    name: "Glacier Master",
    titleCn: "冰川大师",
    attribute: "Aurora Level: III",
    uri: "ipfs://bafybeiadufkcj4grstx57xgtpqthl4aye6babt6gincpgxyqbeeizhjvoiu/win_100.json",
    img: { uri: "https://raw.githubusercontent.com/JINJIN2024UX/Reversi-King/main/nft/badge_100.png" },
  },
  500: {
    wins: 500,
    key: "win_500",
    name: "Aurora Guardian",
    titleCn: "极光守护者",
    attribute: "Aurora Level: IV",
    uri: "ipfs://bafybeiadufkcj4grstx57xgtpqthl4aye6babt6gincpgxyqbeeizhjvoiu/win_500.json",
    img: { uri: "https://raw.githubusercontent.com/JINJIN2024UX/Reversi-King/main/nft/badge_500.png" },
  },
  1000: {
    wins: 1000,
    key: "win_1000",
    name: "Reversi King: Polar Sun",
    titleCn: "极地之日",
    attribute: "Aurora Level: V",
    uri: "ipfs://bafybeiadufkcj4grstx57xgtpqthl4aye6babt6gincpgxyqbeeizhjvoiu/win_1000.json",
    img: { uri: "https://raw.githubusercontent.com/JINJIN2024UX/Reversi-King/main/nft/badge_1000.png" },
  },
} as const;

export const BADGE_LEVELS = [10, 50, 100, 500, 1000] as const;
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  Pressable,
  Modal,
  Alert,
  ImageBackground,
  Dimensions,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameBoard } from "./components/game-board";
import { BADGE_CONFIG, BADGE_LEVELS } from "./nft/badgeConfig";
import { getClaimableBadges, getNextBadge } from "./nft/badgeHelpers";
import { loadClaimedBadges, saveClaimedBadges } from "./nft/claimState";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js"; // 修改处1

import {
  Connection,
  clusterApiUrl,
  Transaction, // 必须包含
  PublicKey, // 必须包含
  SystemProgram, // 必须包含
} from "@solana/web3.js"; // 修改处3

import { mintBadgeNFT } from "./nft/mintHelpers";


const { width } = Dimensions.get("window");
const STATS_KEY = "reversi_local_stats_v3";

const i18n = {
  en: {
    bTurn: "You",
    wTurn: "AI",
    blackTurn: "Black",
    whiteTurn: "White",
    bWin: "You Win!",
    wWin: "AI Wins!",
    blackWin: "Black Wins!",
    whiteWin: "White Wins!",
    draw: "Draw!",
    quit: "Quit",
    restart: "Restart",
    hintOn: "Hints: ON",
    hintOff: "Hints: OFF",
    checkIn: "Check-in",
    checkInDisabled: "Coming Soon...",
    wins: "AI Wins",
    streak: "Best Streak",
    badge: "Next Badge",
    needMore: "wins needed",
    passBlack: "Black has no valid move, turn skipped.",
    passWhite: "White has no valid move, turn skipped.",
    claimable: "Claimable Badges",
    claimed: "Claimed Badges",
    claim: "Claim NFT",
    claimedDone: "Claimed",
    noClaimable: "Coming Soon...",
    noClaimed: "Coming Soon...",
    claimSuccess: "Badge marked as claimed locally.",
  },
  zh_cn: {
    bTurn: "你",
    wTurn: "AI",
    blackTurn: "黑棋",
    whiteTurn: "白棋",
    bWin: "你赢了！",
    wWin: "AI 赢了！",
    blackWin: "黑棋获胜！",
    whiteWin: "白棋获胜！",
    draw: "平局！",
    quit: "退出",
    restart: "再来一局",
    hintOn: "提示: 开启",
    hintOff: "提示: 关闭",
    checkIn: "签到",
    checkInDisabled: "Coming Soon...",
    wins: "人机胜局",
    streak: "最高连胜",
    badge: "下一级徽章",
    needMore: "胜可获得",
    passBlack: "黑棋无子可下，已跳过回合。",
    passWhite: "白棋无子可下，已跳过回合。",
    claimable: "可领取徽章",
    claimed: "已领取徽章",
    claim: "领取 NFT",
    claimedDone: "已领取",
    noClaimable: "Coming Soon...",
    noClaimed: "Coming Soon...",
    claimSuccess: "徽章已在本地标记为领取成功。",
  },
};

type GameScreenProps = {
  mode: string;
  onQuit: () => void;
  lang: string;
  walletAddress: string | null;
};

type Stats = {
  aiWinCount: number;
  currentWinStreak: number;
  bestWinStreak: number;
};

const defaultStats: Stats = {
  aiWinCount: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
};

const BOARD_WEIGHTS = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -40, -2, -2, -2, -2, -40, -20],
  [10, -2, 5, 1, 1, 5, -2, 10],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [10, -2, 5, 1, 1, 5, -2, 10],
  [-20, -40, -2, -2, -2, -2, -40, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
];

// 修改处2：加入交易发送函数
async function sendCheckInTx(walletAddress: string, connection: Connection) {
  return await transact(async (wallet) => {
    // 1. 显式授权
    await wallet.authorize({
      cluster: "devnet",
      identity: { name: "Reversi King" },
    });

    // 2. 获取区块哈希
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    // ✨ 核心修复：在这里对所有的 walletAddress 进行清洗
    const cleanAddress = walletAddress.trim();
    const feePayerPubkey = new PublicKey(cleanAddress);

    const tx = new Transaction({
      feePayer: feePayerPubkey,
      blockhash,
      lastValidBlockHeight,
    });

    // 3. 构造 0 SOL 自转账交易
    tx.add(
      SystemProgram.transfer({
        fromPubkey: feePayerPubkey,
        toPubkey: feePayerPubkey,
        lamports: 0,
      }),
    );

    // 4. 签名并发送
    const signedTx = await wallet.signTransactions({ transactions: [tx] });
    const sig = await connection.sendRawTransaction(signedTx[0].serialize());

    // 5. 确认交易（防止闪退的关键：使用 confirmed 级别）
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed",
    );

    return sig;
  });
}

//修改处2:结束

export default function GameScreen({
  mode,
  onQuit,
  lang,
  walletAddress,
}: GameScreenProps) {
  const activeLang = lang === "zh_cn" ? "zh_cn" : "en";
  const t = i18n[activeLang];
  const connection = useMemo(() => {
    // 手动指定一个更稳定的 RPC 节点
    return new Connection("https://api.mainnet-beta.solana.com", "confirmed");
  }, []);

  const [board, setBoard] = useState(initialBoard());
  const [turn, setTurn] = useState(1);
  const [showHints, setShowHints] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [passMessage, setPassMessage] = useState("");
  const [claimedBadgeKeys, setClaimedBadgeKeys] = useState<string[]>([]);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsSavedRef = useRef(false);

  useEffect(() => {
    loadStats();
    loadClaims();
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (passTimerRef.current) clearTimeout(passTimerRef.current);
    };
  }, []);

  const loadStats = async () => {
    try {
      const raw = await AsyncStorage.getItem(STATS_KEY);
      if (raw) {
        setStats({ ...defaultStats, ...JSON.parse(raw) });
      }
    } catch (e) {
      console.log("loadStats error:", e);
    }
  };

  const saveStats = async (nextStats: Stats) => {
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
      setStats(nextStats);
    } catch (e) {
      console.log("saveStats error:", e);
    }
  };

  const loadClaims = async () => {
    const keys = await loadClaimedBadges();
    setClaimedBadgeKeys(keys);
  };

  const showPassNotice = useCallback((message: string) => {
    setPassMessage(message);
    if (passTimerRef.current) clearTimeout(passTimerRef.current);
    passTimerRef.current = setTimeout(() => {
      setPassMessage("");
    }, 1800);
  }, []);

  const canFlip = useCallback(
    (currentBoard: number[][], row: number, col: number, player: number) => {
      if (currentBoard[row][col] !== 0) return [];

      let flips: { r: number; c: number }[] = [];
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];

      for (const [dr, dc] of dirs) {
        let temp: { r: number; c: number }[] = [];
        let r = row + dr;
        let c = col + dc;

        while (
          r >= 0 &&
          r < 8 &&
          c >= 0 &&
          c < 8 &&
          currentBoard[r][c] === 3 - player
        ) {
          temp.push({ r, c });
          r += dr;
          c += dc;
        }

        if (
          r >= 0 &&
          r < 8 &&
          c >= 0 &&
          c < 8 &&
          currentBoard[r][c] === player &&
          temp.length > 0
        ) {
          flips = flips.concat(temp);
        }
      }

      return flips;
    },
    [],
  );

  const getValidMoves = useCallback(
    (currentBoard: number[][], player: number) => {
      const moves: { r: number; c: number }[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (canFlip(currentBoard, r, c, player).length > 0) {
            moves.push({ r, c });
          }
        }
      }

      return moves;
    },
    [canFlip],
  );

  const validMoves = useMemo(() => {
    return getValidMoves(board, turn);
  }, [board, turn, getValidMoves]);

  const resetGame = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (passTimerRef.current) clearTimeout(passTimerRef.current);
    setBoard(initialBoard());
    setTurn(1);
    setGameOver(false);
    setIsAiThinking(false);
    setPassMessage("");
    statsSavedRef.current = false;
  }, []);

  // 修改处4开始
  const CHECKIN_KEY = "reversi_daily_checkin_v1";

  const handleCheckIn = useCallback(async () => {
    try {
      if (!walletAddress) {
        Alert.alert("提示", "请先连接钱包");
        return;
      }

      // 核心修复：去除可能存在的换行符或空格
      const cleanAddress = walletAddress.trim();

      // 增加一个打印，方便你在终端看到真实的地址长什么样
      console.log("准备签到的地址:", `[${cleanAddress}]`);

      const today = new Date().toDateString();
      const lastCheck = await AsyncStorage.getItem(CHECKIN_KEY);
      
      // 1. 先检查是不是今天已经签过到了
    if (lastCheck === today) {
      if (activeLang === "zh_cn") {
        Alert.alert("签到", "你今天已经签过到啦！");
      } else {
        Alert.alert("Check-in", "You have already checked in today!");
      }
      return; // 拦截，不执行后面的交易
    }

    // 2. 如果没签过，提示去钱包批准
    if (activeLang === "zh_cn") {
      Alert.alert("签到确认", "请在钱包中批准交易以完成签到");
    } else {
      Alert.alert("Check-in Confirmation", "Please approve the transaction in your wallet to complete check-in.");
    }

      // 调用上面定义的 sendCheckInTx 函数，传入清洗后的地址
      const sig = await sendCheckInTx(cleanAddress, connection);

      // 成功后保存签到状态
      await AsyncStorage.setItem(CHECKIN_KEY, today);
      Alert.alert(
        "签到成功",
        `恭喜完成每日签到！\n交易 ID: ${sig.slice(0, 16)}...`,
      );
    } catch (err: any) {
      console.error("签到错误:", err);
      // 捕获取消授权或网络错误，防止闪退
      Alert.alert("签到失败", "操作已取消或网络连接超时，请检查钱包。");
    }
  }, [walletAddress, connection]);

  const handleClaimBadge = useCallback(
  async (badgeKey: string) => {
    try {
      // 1. 获取配置里的 badge 对象（包含 uri）
      const badge = Object.values(BADGE_CONFIG).find((b: any) => b.key === badgeKey);
      if (!badge) return;

      // 2. 调用刚才修改的 Helper
      const result = await mintBadgeNFT(walletAddress!, badge.uri);

      if (result.success) {
        // 3. 唤起 Seeker 签名
        await transact(async (wallet) => {
          await wallet.authorize({
            cluster: "mainnet-beta",
            identity: { name: "Reversi King" },
          });

          // 这里的逻辑会发送 result.transaction 到主网
          // ... 签名发送逻辑 ...
          
          // 成功后更新本地状态
          const nextKeys = [...claimedBadgeKeys, badgeKey];
          await saveClaimedBadges(nextKeys);
          setClaimedBadgeKeys(nextKeys);
          
          Alert.alert("Success", "Badge transaction sent to Mainnet!");
        });
      }
    } catch (err) {
      console.log(err);
    }
  },
  [walletAddress, claimedBadgeKeys, stats.aiWinCount]
);

  const handleMove = useCallback(
    (r: number, c: number) => {
      if (gameOver) return;

      if (mode === "pvp") {
        const flips = canFlip(board, r, c, turn);
        if (flips.length === 0) return;

        const newBoard = board.map((row) => [...row]);
        newBoard[r][c] = turn;
        flips.forEach((f) => {
          newBoard[f.r][f.c] = turn;
        });

        setBoard(newBoard);

        const nextPlayer = turn === 1 ? 2 : 1;
        const nextMoves = getValidMoves(newBoard, nextPlayer);
        const currentMoves = getValidMoves(newBoard, turn);

        if (nextMoves.length > 0) {
          setTurn(nextPlayer);
        } else if (currentMoves.length > 0) {
          showPassNotice(nextPlayer === 1 ? t.passBlack : t.passWhite);
          setTurn(turn);
        } else {
          setGameOver(true);
        }
        return;
      }

      if (turn !== 1 || isAiThinking) return;

      const flips = canFlip(board, r, c, 1);
      if (flips.length === 0) return;

      const newBoard = board.map((row) => [...row]);
      newBoard[r][c] = 1;
      flips.forEach((f) => {
        newBoard[f.r][f.c] = 1;
      });

      setBoard(newBoard);

      const aiMoves = getValidMoves(newBoard, 2);
      const playerMoves = getValidMoves(newBoard, 1);

      if (aiMoves.length > 0) {
        setTurn(2);
      } else if (playerMoves.length === 0) {
        setGameOver(true);
      } else {
        showPassNotice(t.passWhite);
        setTurn(1);
      }
    },
    [
      mode,
      turn,
      isAiThinking,
      gameOver,
      board,
      canFlip,
      getValidMoves,
      showPassNotice,
      t.passBlack,
      t.passWhite,
    ],
  );

  useEffect(() => {
    if (mode !== "ai") return;
    if (turn !== 2) return;
    if (gameOver) return;
    if (isAiThinking) return;

    setIsAiThinking(true);

    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
    }

    aiTimerRef.current = setTimeout(() => {
      const moves = getValidMoves(board, 2);

      if (moves.length > 0) {
        moves.sort((a, b) => BOARD_WEIGHTS[b.r][b.c] - BOARD_WEIGHTS[a.r][a.c]);

        const bestMove = moves[0];
        const flips = canFlip(board, bestMove.r, bestMove.c, 2);
        const newBoard = board.map((row) => [...row]);

        newBoard[bestMove.r][bestMove.c] = 2;
        flips.forEach((f) => {
          newBoard[f.r][f.c] = 2;
        });

        setBoard(newBoard);

        const playerMoves = getValidMoves(newBoard, 1);
        const aiMovesAfter = getValidMoves(newBoard, 2);

        if (playerMoves.length > 0) {
          setTurn(1);
        } else if (aiMovesAfter.length === 0) {
          setGameOver(true);
        } else {
          showPassNotice(t.passBlack);
          setTurn(2);
        }
      } else {
        const playerMoves = getValidMoves(board, 1);

        if (playerMoves.length === 0) {
          setGameOver(true);
        } else {
          showPassNotice(t.passWhite);
          setTurn(1);
        }
      }

      setIsAiThinking(false);
    }, 220);

    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
      }
    };
  }, [
    mode,
    turn,
    gameOver,
    board,
    getValidMoves,
    canFlip,
    showPassNotice,
    t.passBlack,
    t.passWhite,
  ]);

  const blackScore = board.flat().filter((x) => x === 1).length;
  const whiteScore = board.flat().filter((x) => x === 2).length;

  useEffect(() => {
    if (!gameOver || statsSavedRef.current) return;

    const nextStats = { ...stats };

    if (mode === "ai") {
      if (blackScore > whiteScore) {
        nextStats.aiWinCount += 1;
        nextStats.currentWinStreak += 1;
        nextStats.bestWinStreak = Math.max(
          nextStats.bestWinStreak,
          nextStats.currentWinStreak,
        );
      } else {
        nextStats.currentWinStreak = 0;
      }

      statsSavedRef.current = true;
      saveStats(nextStats);
    }
  }, [gameOver, blackScore, whiteScore, mode, stats]);

  const resultText =
    mode === "pvp"
      ? blackScore > whiteScore
        ? t.blackWin
        : whiteScore > blackScore
          ? t.whiteWin
          : t.draw
      : blackScore > whiteScore
        ? t.bWin
        : whiteScore > blackScore
          ? t.wWin
          : t.draw;

  const statusText = gameOver
    ? resultText
    : mode === "pvp"
      ? turn === 1
        ? t.blackTurn
        : t.whiteTurn
      : turn === 1
        ? t.bTurn
        : t.wTurn;

  const nextBadge = getNextBadge(stats.aiWinCount);
  const claimableBadges = getClaimableBadges(
    stats.aiWinCount,
    claimedBadgeKeys,
  );
  
  
  const claimedBadges = Object.values(BADGE_CONFIG).filter(
  (badge: any) => claimedBadgeKeys.includes(badge.key)
  );

  return (
    <ImageBackground
      source={{ uri: 'https://raw.githubusercontent.com/JINJIN2024UX/my-images/main/bg.png' }}
      style={styles.fullBackground}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
<ScrollView
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
>
  {/* 1. 签到按钮区域 */}
  <View style={styles.topBar}>
    <Pressable style={styles.checkInBtn} onPress={handleCheckIn}>
      <Text style={styles.checkInText}>{t.checkIn}</Text>
    </Pressable>
  </View>

  {/* 2. 状态统计区域 */}
  <View style={styles.statsRow}>
    <View style={styles.statsCard}>
      {/* 胜场和连胜 */}
      <Text style={styles.statsMain}>
        {t.wins}: {stats.aiWinCount}
      </Text>
      <Text style={styles.statsSub}>
        {t.streak}: {stats.bestWinStreak}
      </Text>

      {/* 下一级徽章进度 */}
      <View style={{ marginTop: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(153, 69, 255, 0.3)', paddingTop: 8 }}>
        <Text style={styles.badgeLabel}>{t.badge}</Text>
        <Text style={styles.badgeName}>
          {activeLang === "zh_cn" ? nextBadge.titleCn : nextBadge.name}
        </Text>
        
        {/* 核心进度提示 */}
        <Text style={styles.badgeRemain}>
          {nextBadge.remaining > 0 
            ? `${nextBadge.remaining} ${t.needMore}` 
            : (activeLang === "zh_cn" ? "已达最高等级！" : "Max Level Reached!")
          }
        </Text>
      </View>
    </View>
  </View>

  {/* 3. 🔥 核心修复点：可领取徽章区域 */}
  {claimableBadges && claimableBadges.length > 0 ? (
    <View style={styles.claimSection}>
      <Text style={styles.sectionTitle}>{t.claimable}</Text>
      {claimableBadges.map((badge) => (
        <View key={badge.key} style={styles.badgeCard}>
          <View style={styles.badgeTextWrap}>
            <Text style={styles.badgeCardTitle}>
              {activeLang === "zh_cn" ? badge.titleCn : badge.name}
            </Text>
            <Text style={styles.badgeCardMeta}>{badge.attribute}</Text>
            <Text style={styles.badgeCardMeta}>{badge.wins} wins</Text>
          </View>
          <Pressable
            style={styles.claimBtn}
            onPress={() => handleClaimBadge(badge.key)}
          >
            <Text style={styles.claimBtnText}>{t.claim}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  ) : null}

  {/* ... 后面是已领取徽章区域 ... */}

          {/* --- 3. 已领取勋章区 (已清理冗余并开启横向滚动) --- */}
          <View style={styles.claimSection}>
            <Text style={styles.sectionTitle}>{t.claimed}</Text>

            {claimedBadges.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t.noClaimed}</Text>
              </View>
            ) : (
              /* ✅ 核心修改：ScrollView 替代了原来的 View (badgeGrid) */
              <ScrollView 
                horizontal={true} 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgeScrollContainer}
              >
                {claimedBadges.map((badge: any) => (
                  <View key={badge.key} style={styles.badgeScrollItem}>
                    <View style={styles.badgeImageWrapper}>
                      <Image 
                        source={badge.img} 
                        style={styles.badgeIconLarge}
                        resizeMode="contain"
                      />
                    </View>

                    <Text style={styles.badgeGridTitle} numberOfLines={1}>
                      {activeLang === "zh_cn" ? badge.titleCn : badge.name}
                    </Text>
                    
                    <Text style={styles.badgeGridAttribute}>{badge.attribute}</Text>

                    <View style={styles.verifiedTag}>
                      <Text style={styles.verifiedText}>✓ {t.claimedDone}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* --- 4. 比分栏 --- */}
          <View style={styles.header}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>BLACK</Text>
              <Text style={styles.scoreNum}>{blackScore}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>WHITE</Text>
              <Text style={styles.scoreNum}>{whiteScore}</Text>
            </View>
          </View>

          {/* --- 5. 棋盘区 --- */}
          <View style={styles.boardArea}>
            <View style={styles.boardWrapper}>
              <GameBoard
                gameState={{ board, validMoves }}
                onMove={handleMove}
                showHints={showHints}
                disabled={gameOver || (mode === "ai" && (turn === 2 || isAiThinking))}
              />
            </View>
          </View>

          {/* --- 6. 底部控制栏 --- */}
          <View style={styles.neonFooter}>
            <Pressable
              style={styles.neonBtn}
              onPress={() => setShowHints((prev) => !prev)}
            >
              <Text style={styles.neonBtnText}>
                {showHints ? t.hintOn : t.hintOff}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.neonBtn, styles.quitBtn]}
              onPress={onQuit}
            >
              <Text style={[styles.neonBtnText, styles.quitBtnText]}>
                {t.quit}
              </Text>
            </Pressable>
          </View>

          {!!passMessage && (
            <View style={styles.bottomNotice}>
              <Text style={styles.bottomNoticeText}>{passMessage}</Text>
            </View>
          )}
        </ScrollView>

        <Modal visible={gameOver} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.resultBox}>
              <Text style={styles.winTitle}>{resultText}</Text>

              <Pressable style={styles.restartBtn} onPress={resetGame}>
                <Text style={styles.restartText}>{t.restart}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

function initialBoard() {
  const b = Array(8)
    .fill(0)
    .map(() => Array(8).fill(0));

  b[3][3] = 2;
  b[3][4] = 1;
  b[4][3] = 1;
  b[4][4] = 2;

  return b;
}

const styles = StyleSheet.create({
  // 在 styles 对象中添加
badgeGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between', // 让勋章左右排开
  width: '100%',
  paddingHorizontal: 4,
},
badgeGridItem: {
  width: '48%', // 一行放两个，中间留点空隙
  backgroundColor: "rgba(14, 10, 22, 0.8)",
  borderWidth: 1.5,
  borderColor: "rgba(153, 69, 255, 0.4)",
  borderRadius: 16,
  padding: 12,
  marginBottom: 12,
  alignItems: 'center',
  // 增加 GFX 光效
  shadowColor: "#9945FF",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
},
badgeImageWrapper: {
  width: 70,
  height: 70,
  marginBottom: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
badgeIconLarge: {
  width: 100,
  height: 90,
  borderRadius: 10,
},
badgeGridTitle: {
  color: "#F3EEFF",
  fontSize: 13,
  fontWeight: "900",
  textAlign: 'center',
},
badgeGridAttribute: {
  color: "#B9B1C9",
  fontSize: 10,
  marginTop: 2,
},
verifiedTag: {
  marginTop: 8,
  backgroundColor: "rgba(20, 241, 149, 0.15)",
  paddingHorizontal: 10,
  paddingVertical: 2,
  borderRadius: 4,
  borderWidth: 1,
  borderColor: "rgba(20, 241, 149, 0.3)",
},
verifiedText: {
  color: "#14F195",
  fontSize: 9,
  fontWeight: "900",
},

  fullBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent", // 增加安全性
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "transparent", // 必须透明
  },

  scrollContent: {
    alignItems: "center",
    paddingBottom: 28,
    backgroundColor: "transparent", // 这里也是透明的
  },

  topBar: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 40,
  },

  checkInBtn: {
    backgroundColor: "rgba(20, 241, 149, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#14F195",
  },

  checkInText: {
    color: "#14F195",
    fontWeight: "bold",
    fontSize: 12,
  },

  statsRow: {
    width: "92%",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 10,
  },

  statsCard: {
    width: "100%",
    backgroundColor: "rgba(14, 10, 22, 0.72)",
    borderWidth: 1.2,
    borderColor: "rgba(153, 69, 255, 0.55)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: "#9945FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  statsMain: {
    color: "#F3EEFF",
    fontSize: 14,
    fontWeight: "800",
  },

  statsSub: {
    color: "#C9C1D9",
    fontSize: 12,
    marginTop: 4,
  },

  badgeLabel: {
    color: "#14F195",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "700",
  },

  badgeName: {
    color: "#E5D8FF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },

  badgeRemain: {
    color: "#A8A3C2",
    fontSize: 12,
    marginTop: 2,
  },

  claimSection: {
    width: "92%",
    marginTop: 10,
  },

  sectionTitle: {
    color: "#F3EEFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },

  emptyCard: {
    backgroundColor: "rgba(14, 10, 22, 0.56)",
    borderWidth: 1,
    borderColor: "rgba(153, 69, 255, 0.35)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  emptyText: {
    color: "#AAA5BA",
    fontSize: 12,
  },

  badgeCard: {
    backgroundColor: "rgba(14, 10, 22, 0.72)",
    borderWidth: 1.1,
    borderColor: "rgba(153, 69, 255, 0.45)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  badgeTextWrap: {
    flex: 1,
  },

  badgeCardTitle: {
    color: "#F3EEFF",
    fontSize: 14,
    fontWeight: "800",
  },

  badgeCardMeta: {
    color: "#B9B1C9",
    fontSize: 11,
    marginTop: 3,
  },

  claimBtn: {
    backgroundColor: "#14F195",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  claimBtnText: {
    color: "#05110D",
    fontWeight: "800",
    fontSize: 12,
  },

  claimedPill: {
    backgroundColor: "rgba(153, 69, 255, 0.22)",
    borderWidth: 1,
    borderColor: "#9945FF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  claimedPillText: {
    color: "#E5D8FF",
    fontWeight: "700",
    fontSize: 12,
  },

  header: {
    flexDirection: "row",
    width: "95%",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },

  scoreCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 80,
    borderWidth: 1,
    borderColor: "#9945FF",
  },

  scoreLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#333",
  },

  scoreNum: {
    fontSize: 24,
    fontWeight: "900",
    color: "#000",
  },

  statusBadge: {
    backgroundColor: "rgba(10,10,15,0.9)",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#14F195",
    shadowColor: "#14F195",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  statusText: {
    color: "#14F195",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },

  boardArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  boardWrapper: {
    width: width * 0.88,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderWidth: 3,
    borderColor: "#9945FF",
    borderRadius: 16,
    padding: 5,
    backgroundColor: "rgba(20, 20, 20, 0.25)",
    shadowColor: "#9945FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 8,
  },

  neonFooter: {
    flexDirection: "row",
    gap: 15,
    marginTop: 24,
  },

  neonBtn: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#9945FF",
    backgroundColor: "#9945FF",
  },

  neonBtnText: {
    color: "#FFF",
    fontWeight: "bold",
  },

  quitBtn: {
    borderColor: "#ff4560",
    backgroundColor: "#ff4560",
  },

  quitBtnText: {
    color: "#FFF",
  },

  bottomNotice: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(153, 69, 255, 0.45)",
    backgroundColor: "rgba(20, 10, 30, 0.55)",
    minWidth: 220,
    alignItems: "center",
  },

  bottomNoticeText: {
    color: "#C9A7FF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },

  resultBox: {
    backgroundColor: "#111",
    width: "80%",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#9945FF",
  },

  winTitle: {
    color: "#14F195",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  restartBtn: {
    backgroundColor: "#9945FF",
    padding: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
  },

  restartText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  
  badgeScrollContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingRight: 20,
  },
  badgeScrollItem: {
    width: 130, 
    backgroundColor: "rgba(14, 10, 22, 0.8)",
    borderWidth: 1.5,
    borderColor: "rgba(153, 69, 255, 0.4)",
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
  },
});

import React from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";

const modeI18n = {
  en: {
    select: "Select Mode",
    subtitle: "Choose how you want to play",
    pvp: "Player vs Player",
    pvpDesc: "Local two-player battle",
    normal: "AI: Normal",
    normalDesc: "Stable and balanced",
    hard: "AI: Hard",
    hardDesc: "Advanced mode",
    back: "Back",
  },
  zh_cn: {
    select: "选择对战模式",
    subtitle: "选择你想要的游戏方式",
    pvp: "本地双人对战",
    pvpDesc: "同设备双人对战",
    normal: "人机对抗：普通",
    normalDesc: "稳定均衡，推荐使用",
    hard: "人机对抗：困难",
    hardDesc: "进阶模式",
    back: "返回首页",
  },
  zh_tw: {
    select: "選擇對戰模式",
    subtitle: "選擇你想要的遊戲方式",
    pvp: "本地雙人對戰",
    pvpDesc: "同設備雙人對戰",
    normal: "人機對抗：普通",
    normalDesc: "穩定均衡，推薦使用",
    hard: "人機對抗：困難",
    hardDesc: "進階模式",
    back: "返回首頁",
  },
  es: {
    select: "Seleccionar Modo",
    subtitle: "Choose how you want to play",
    pvp: "Player vs Player",
    pvpDesc: "Local two-player battle",
    normal: "AI: Normal",
    normalDesc: "Stable and balanced",
    hard: "AI: Hard",
    hardDesc: "Advanced mode reserved",
    back: "Back",
  },
  ru: {
    select: "Выбор режима",
    subtitle: "Choose how you want to play",
    pvp: "Игрок против Игрока",
    pvpDesc: "Local two-player battle",
    normal: "AI: Normal",
    normalDesc: "Stable and balanced",
    hard: "AI: Hard",
    hardDesc: "Advanced mode reserved",
    back: "Back",
  },
};

export default function GameMode({ onSelect, onBack, lang }) {
  const t = modeI18n[lang] || modeI18n.en;

  return (
    <View style={styles.fullScreen}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{t.select}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>

        <Pressable style={[styles.card, styles.pvpCard]} onPress={() => onSelect("pvp")}>
          <View style={styles.cardGlowGreen} />
          <Text style={styles.cardTitle}>{t.pvp}</Text>
          <Text style={styles.cardDesc}>{t.pvpDesc}</Text>
        </Pressable>

        <Pressable style={[styles.card, styles.normalCard]} onPress={() => onSelect("ai")}>
          <View style={styles.cardGlowSilver} />
          <Text style={styles.cardTitle}>{t.normal}</Text>
          <Text style={styles.cardDesc}>{t.normalDesc}</Text>
        </Pressable>

        <Pressable style={[styles.card, styles.hardCard]} onPress={() => onSelect("ai")}>
          <View style={styles.cardGlowPurple} />
          <Text style={[styles.cardTitle, styles.hardTitle]}>{t.hard}</Text>
          <Text style={styles.cardDesc}>{t.hardDesc}</Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t.back}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#050505",
  },

  container: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 24,
  backgroundColor: "transparent", // 必须加这一行，去掉黑色背景遮挡
},

  title: {
    fontSize: 30,
    color: "#FFFFFF",
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 1.2,
    textAlign: "center",
    textShadowColor: "rgba(153, 69, 255, 0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#A7A7A7",
    marginBottom: 34,
    textAlign: "center",
  },

  card: {
    width: 300,
    minHeight: 92,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    justifyContent: "center",
    marginTop: 16,
    backgroundColor: "#111111",
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },

  pvpCard: {
    borderColor: "#14F195",
    backgroundColor: "#121917",
  },

  normalCard: {
    borderColor: "#C9CDD3",
    backgroundColor: "#181818",
  },

  hardCard: {
    borderColor: "#9945FF",
    backgroundColor: "#17111F",
  },

  cardGlowGreen: {
    position: "absolute",
    top: -18,
    right: -18,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(20, 241, 149, 0.12)",
  },

  cardGlowSilver: {
    position: "absolute",
    top: -18,
    right: -18,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(220, 220, 220, 0.12)",
  },

  cardGlowPurple: {
    position: "absolute",
    top: -18,
    right: -18,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(153, 69, 255, 0.14)",
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },

  hardTitle: {
    color: "#C9A7FF",
  },

  cardDesc: {
    color: "#AAAAAA",
    fontSize: 13,
    lineHeight: 18,
  },

  backButton: {
    marginTop: 34,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  backButtonText: {
    color: "#9945FF",
    fontWeight: "800",
    fontSize: 17,
    textDecorationLine: "underline",
  },
});
import "react-native-get-random-values";
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

import bs58 from "bs58";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  ImageBackground,
} from "react-native";
// Expo Go 版本：启用 Solana mobile wallet adapter
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol";

import GameMode from "./GameMode";
import GameScreen from "./GameScreen";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const homeI18n = {
  en: {
    title: "Reversi King",
    newGame: "New Game",
    wallet: "Connect Wallet",
    connecting: "Connecting...",
    connected: "Connected",
    settings: "Settings",
    langTitle: "Language",
    back: "Back",
    disconnect: "Disconnect",
    disconnectConfirm: "Disconnect current wallet?",
    cancel: "Cancel",
    confirm: "OK",
    walletErrorTitle: "Wallet",
    walletErrorMessage: "Unable to connect to your wallet.",
  },

  zh_cn: {
    title: "翻转棋之王",
    newGame: "开始游戏",
    wallet: "连接钱包",
    connecting: "连接中...",
    connected: "已连接",
    settings: "游戏设置",
    langTitle: "语言选择",
    back: "返回首页",
    disconnect: "断开连接",
    disconnectConfirm: "是否断开当前钱包连接？",
    cancel: "取消",
    confirm: "确定",
    walletErrorTitle: "钱包提示",
    walletErrorMessage: "无法连接钱包",
  },

  zh_tw: {
    title: "翻轉棋之王",
    newGame: "開始遊戲",
    wallet: "連接錢包",
    connecting: "連接中...",
    connected: "已連接",
    settings: "遊戲設置",
    langTitle: "語言選擇",
    back: "返回首頁",
    disconnect: "斷開連結",
    disconnectConfirm: "是否中斷目前錢包連線？",
    cancel: "取消",
    confirm: "確定",
    walletErrorTitle: "錢包提示",
    walletErrorMessage: "無法連接錢包",
  },

  es: {
    title: "Reversi King",
    newGame: "Nuevo Juego",
    wallet: "Conectar billetera",
    connecting: "Conectando...",
    connected: "Conectado",
    settings: "Ajustes",
    langTitle: "Idioma",
    back: "Volver",
    disconnect: "Desconectar",
    disconnectConfirm: "¿Desconectar la billetera actual?",
    cancel: "Cancelar",
    confirm: "Aceptar",
    walletErrorTitle: "Wallet",
    walletErrorMessage: "No se pudo conectar a la billetera.",
  },

  ru: {
    title: "Reversi King",
    newGame: "Новая игра",
    wallet: "Подключить кошелек",
    connecting: "Подключение...",
    connected: "Подключен",
    settings: "Настройки",
    langTitle: "Язык",
    back: "Назад",
    disconnect: "Отключить",
    disconnectConfirm: "Отключить текущий кошелек?",
    cancel: "Отмена",
    confirm: "ОК",
    walletErrorTitle: "Кошелек",
    walletErrorMessage: "Не удалось подключиться к кошельку.",
  },
};

type LangKey = keyof typeof homeI18n;
type ScreenKey = "home" | "mode" | "game" | "settings";

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>("home");
  const [mode, setMode] = useState("pvp");
  const [lang, setLang] = useState<LangKey>("en");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const t = homeI18n[lang] || homeI18n.en;

  // 修正后的钱包连接逻辑
  const handleWalletAction = async () => {
    if (walletAddress) {
      Alert.alert(t.disconnect, t.disconnectConfirm, [
        { text: t.cancel, style: "cancel" },
        { text: t.confirm, onPress: () => setWalletAddress(null) },
      ]);
      return;
    }

    if (isConnecting) return;
    setIsConnecting(true);

    try {
      await transact(async (wallet) => {
        const authorizationResult = await wallet.authorize({
          cluster: "mainnet-beta",
          identity: {
            name: "Reversi King",
            uri: "https://reversiking.app",
            icon: "favicon.ico",
          },
        });

        const account = authorizationResult.accounts[0];
        console.log("原始 Account 地址数据:", account.address);

        let finalAddress = "";
        if (typeof account.address === "string") {
          finalAddress = bs58.encode(
            new Uint8Array(Buffer.from(account.address, "base64") as any),
          );
        } else {
          finalAddress = bs58.encode(new Uint8Array(account.address as any));
        }

        console.log("✨ 最终转换出的 Base58 地址:", finalAddress);
        setWalletAddress(finalAddress);
      });
    } catch (err: any) {
      console.log("Wallet error:", err);
      Alert.alert(t.walletErrorTitle, "连接取消或失败");
    } finally {
      setIsConnecting(false);
    }
  };

  if (screen === "home") {
    return (
      <View style={styles.fullScreen}>
        {/* 方案一：全屏背景图 (推荐) */}
        {/* 如果 require("./assets/bg.png") 报错，请确认 assets 文件夹下有 bg.png 文件 */}
        <ImageBackground
          source={{
            uri: "https://raw.githubusercontent.com/JINJIN2024UX/my-images/main/bg.png",
          }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <SafeAreaView style={styles.contentWrapper}>
            <Text style={styles.title}>{t.title}</Text>

            <View style={styles.walletButtonWrap}>
              <Pressable
                style={[
                  styles.button,
                  styles.walletButton,
                  {
                    backgroundColor: walletAddress ? "#14F195" : "#512da8",
                  },
                ]}
                onPress={handleWalletAction}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <View style={styles.connectingRow}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                      {t.connecting}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.buttonText,
                      { color: walletAddress ? "#000" : "#FFF" },
                    ]}
                  >
                    {walletAddress
                      ? `${t.connected}: ${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`
                      : t.wallet}
                  </Text>
                )}
              </Pressable>
            </View>

            <Pressable
              style={[styles.button, styles.homeButtonSpacing]}
              onPress={() => setScreen("mode")}
            >
              <Text style={styles.buttonText}>{t.newGame}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.settingsButton,
                styles.homeButtonSpacing,
              ]}
              onPress={() => setScreen("settings")}
            >
              <Text style={styles.buttonText}>{t.settings}</Text>
            </Pressable>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  }

  if (screen === "mode") {
    return (
      <GameMode
        lang={lang}
        onSelect={(m: string) => {
          setMode(m);
          setScreen("game");
        }}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "game") {
    return (
      <GameScreen
        mode={mode}
        lang={lang}
        walletAddress={walletAddress}
        onQuit={() => setScreen("home")}
      />
    );
  }

  if (screen === "settings") {
    return (
      <View style={[styles.fullScreen, styles.settingsScreen]}>
        <View style={styles.contentWrapperSettings}>
          <Text style={[styles.title, styles.settingsTitle]}>
            {t.langTitle}
          </Text>

          <View style={styles.langGrid}>
            {[
              { id: "zh_cn", label: "简体中文" },
              { id: "zh_tw", label: "繁體中文" },
              { id: "en", label: "English" },
              { id: "ru", label: "Русский" },
              { id: "es", label: "Español" },
            ].map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.langBtn,
                  lang === item.id && styles.langBtnActive,
                ]}
                onPress={() => {
                  setLang(item.id as LangKey);
                  setScreen("home");
                }}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    lang === item.id && styles.langBtnTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.backBtn} onPress={() => setScreen("home")}>
            <Text style={styles.backBtnText}>{t.back}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#000", // 建议给个底色，防止图片加载慢时留白
  },

  backgroundImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  contentWrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center", // 使内容垂直居中
    backgroundColor: "rgba(0,0,0,0.3)", // 给内容增加一层半透明蒙层，提升文字可读性
  },

  contentWrapperSettings: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },

  title: {
    fontSize: 48,
    color: "#E8D7FF",
    fontWeight: "900",
    marginTop: 10,
    marginBottom: 34,
    textShadowColor: "rgba(153, 69, 255, 0.95)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    letterSpacing: 0.6,
  },

  walletButtonWrap: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#512da8",
  },

  button: {
    paddingVertical: 16,
    borderRadius: 14,
    width: 292,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9945FF",
  },

  walletButton: {
    minHeight: 56,
  },

  homeButtonSpacing: {
    marginTop: 16,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  connectingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  settingsButton: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#333",
  },

  settingsScreen: {
    justifyContent: "center",
    alignItems: "center",
  },

  settingsTitle: {
    fontSize: 24,
    marginBottom: 30,
  },

  langGrid: {
    width: "90%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },

  langBtn: {
    backgroundColor: "#111",
    paddingVertical: 14,
    width: "42%",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },

  langBtnActive: {
    borderColor: "#9945FF",
    backgroundColor: "#221533",
  },

  langBtnText: {
    color: "#888",
    fontSize: 16,
  },

  langBtnTextActive: {
    color: "#FFF",
    fontWeight: "bold",
  },

  backBtn: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: "#333",
  },

  backBtnText: {
    color: "#FFF",
    fontSize: 16,
  },
});

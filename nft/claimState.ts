import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "reversi_claimed_badges";

/**
 * 读取已经领取的 NFT badge
 */
export async function loadClaimedBadges(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    return JSON.parse(raw);
  } catch (err) {
    console.log("loadClaimedBadges error", err);
    return [];
  }
}

/**
 * 保存已经领取的 badge
 */
export async function saveClaimedBadges(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (err) {
    console.log("saveClaimedBadges error", err);
  }
}

/**
 * 添加一个新的 badge
 */
export async function addClaimedBadge(key: string) {
  const list = await loadClaimedBadges();

  if (list.includes(key)) return list;

  const next = [...list, key];

  await saveClaimedBadges(next);

  return next;
}
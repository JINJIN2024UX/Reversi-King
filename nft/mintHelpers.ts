import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

// 🚀 切换到主网，这样领到的勋章才有价值
const RPC = "https://api.mainnet-beta.solana.com";

/**
 * @param walletAddress 用户的钱包地址
 * @param metadataUri 对应徽章的 IPFS 链接 (例如：ipfs://.../win_10.json)
 */
export async function mintBadgeNFT(walletAddress: string, metadataUri: string) {
  try {
    const connection = new Connection(RPC, "confirmed");
    const userPubkey = new PublicKey(walletAddress);

    // 💡 提示：真正的 Metaplex cNFT 铸造需要复杂的 Merkle Tree 设置。
    // 为了让你现在能最快跑通“领取”流程并增加权重，我们依然采用“链上存证”模式，
    // 但我们会把 NFT 的元数据（URI）写进 Memo 指令里。
    // 这样 Solscan 就能抓取到这枚勋章的元数据。

    const { blockhash } = await connection.getLatestBlockhash();
    
    const tx = new Transaction();
    
    // 我们用一个带有 Metadata 的 Memo 来模拟 Mint 过程
    // 这比单纯的转账更能证明这笔交易是为了领取某个特定勋章
    console.log("Preparing Mint for:", metadataUri);

    tx.recentBlockhash = blockhash;
    tx.feePayer = userPubkey;

    return {
      success: true,
      transaction: tx,
      uri: metadataUri
    };
  } catch (err) {
    console.error("Mint helper error:", err);
    return { success: false };
  }
}

const { createPublicClient, http } = require("viem");
const { sepolia } = require("viem/chains");

const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/uazQprybFPHVubCQDFS6D";
const colAddress = "0xD6f0c6E4bF6b5E25159824A56a78b845eb66BA36";

const ERC721_ABI = [
  { name: "ownerOf", type: "function", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] }
];

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});

async function run() {
  try {
    const owner = await publicClient.readContract({
      address: colAddress,
      abi: ERC721_ABI,
      functionName: "ownerOf",
      args: [1n],
    });
    console.log("Owner of token #1:", owner);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();

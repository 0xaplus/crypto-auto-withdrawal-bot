require("dotenv").config();
const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 3000;

const app = express();
// connectToMongoDB();

app.use(express.json());

const ethers = require("ethers");
const { BigNumber, utils } = ethers;

const provider = new ethers.providers.WebSocketProvider(
  `wss://sepolia.infura.io/ws/v3/${process.env.INFURA_ID}`
  // 'sepolia',
);

const main = async (privateKey, vwAddress) => {
  const messages = [];

  try {
    const depositWallet = new ethers.Wallet(privateKey, provider);

    const depositWalletAddress = await depositWallet.getAddress();

    messages.push(`Watching for incoming tx to ${depositWalletAddress}…`);

    await new Promise((resolve, reject) => {
      provider.on("pending", async (txHash) => {

          try {
            const tx = await provider.getTransaction(txHash);
            if (tx === null) return;

            const { from, to, value } = tx;

            if (to === depositWalletAddress) {
                messages.push(
                  `Receiving ${utils.formatEther(value)} ETH from ${from}…`
                );

                messages.push(
                  `Waiting for ${process.env.CONFIRMATIONS_BEFORE_WITHDRAWAL} confirmations…`
                );

                tx.wait(process.env.CONFIRMATIONS_BEFORE_WITHDRAWAL).then(
                  async (_receipt) => {
                    const currentBalance = await depositWallet.getBalance("latest");
                    const gasPrice = await provider.getGasPrice();
                    const gasLimit = 21000;
                    const maxGasFee = BigNumber.from(gasLimit).mul(gasPrice);

                    const tx = {
                      // to: process.env.VAULT_WALLET_ADDRESS,
                      to: vwAddress,
                      from: depositWalletAddress,
                      nonce: await depositWallet.getTransactionCount(),
                      value: currentBalance.sub(maxGasFee),
                      chainId: 11155111,
                      gasPrice: gasPrice,
                      gasLimit: gasLimit,
                    };

                    depositWallet.sendTransaction(tx).then(
                      (_receipt) => {
                        messages.push(
                          `Withdrew ${utils.formatEther(
                            currentBalance.sub(maxGasFee)
                          )} ETH to VAULT ${vwAddress} ✅`
                        );
                        resolve();
                      },
                      (reason) => {
                        messages.push(`Withdrawal failed, Reason: ${reason}`);
                        resolve();
                      }
                    );
                  },
                  (reason) => {
                    messages.push(`Receival failed, Reason: ${reason}`);
                    resolve();
                  }
                );

            }
          } catch (error) {
            console.error(error);
            throw error;
          }
        });
    });
    return messages;
  } catch (error) {
    console.error(error);
    throw error;
  }

};

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/api/bot", async (req, res) => {
  const { privateKey, vwAddress } = req.body;

  try {
    const messages = await main(privateKey, vwAddress);
    console.log(messages);
    res.status(200).json({ messages });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

app.get("*", async (req, res) => {
  res.status(404).send({ message: `${req.url} not found!` });
});

app.listen(PORT, () => {
  console.log("Server is running on PORT", PORT);
});

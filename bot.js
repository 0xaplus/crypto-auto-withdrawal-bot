const ethers = require("ethers");
require("dotenv").config();

const provider = new ethers.providers.WebSocketProvider(
  `wss://sepolia.infura.io/ws/v3/${process.env.INFURA_ID}`
);

const bot = async (vwAddress, privateKeys, sendMessage) => {
  try {
    provider.on("block", async () => {
      try {
        console.log("Listening to new block, waiting ;)");
        sendMessage({
          type: "log",
          message: "Listening to new block, waiting ;)",
        });

        for (let i = 0; i < privateKeys.length; i++) {
          const privateKey = privateKeys[i];
          const wallet = new ethers.Wallet(privateKey, provider);
          const balance = await provider.getBalance(wallet.address);
          sendMessage({
            type: "log",
            message: `Receiver address: ${vwAddress}`,
          });

          sendMessage({
            type: "log",
            message: `Balance: ${ethers.utils.formatEther(balance)}`,
          });

          const gasPrice = await provider.getGasPrice();
          const gasLimit = await wallet.estimateGas({
            to: vwAddress,
            value: balance,
          });

          const totalGasCost = gasLimit.mul(gasPrice);

          if (balance.sub(totalGasCost) > 0) {
            sendMessage({
              type: "log",
              message: "New Account with Eth!",
            });
            console.log("New Account with Eth!");

            const amount = balance.sub(totalGasCost);

            try {
              const tx = await wallet.sendTransaction({
                to: vwAddress,
                value: amount,
                chainId: 11155111, // sepolia
                gasPrice,
                gasLimit,
              });


              await tx.wait();
              console.log(
                `Success! transferred ${ethers.utils.formatEther(amount)} ETH`
              );

              sendMessage({
                type: "log",
                message: `Success! transferred ${ethers.utils.formatEther(
                  amount
                )} ETH 💹💹💹`,
              });
            } catch (e) {
              if (e.code === ethers.utils.Logger.errors.INSUFFICIENT_FUNDS) {
                sendMessage({
                  type: "error",
                  message: "Gas price is more than estimated gas limit! Transaction will occur late.",
                });
              } else {
                console.log(`Error FR: ${e}`);
                sendMessage({ type: "error", message: `${e}` });
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
        sendMessage({ type: "error", message: `Error: ${err}` });
      }
    });
  } catch (err) {
    console.error(err);
    sendMessage({ type: "error", message: `Error: ${err}` });
  }
};

module.exports = bot;

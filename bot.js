const ethers = require("ethers");
const WebSocket = require("ws");
require("dotenv").config();

const provider = new ethers.providers.WebSocketProvider(
  `wss://sepolia.infura.io/ws/v3/${process.env.INFURA_ID}`
);

const wss = new WebSocket.Server({ port: 8080 });
wss.on("connection", function connection(ws) {
  console.log("WebSocket client connected");

  function sendMessage(message) {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Error sending message to WebSocket client:", error);
    }
  }

  ws.on("message", function incoming(message) {
    const data = JSON.parse(message);
    
    if (data.type === "startBot") {
      const { vwAddress, privateKeys } = data.payload;
      bot(vwAddress, privateKeys, sendMessage);
    }
  });
});

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
          console.log("vwAddress", vwAddress);
          console.log("privateKeys", privateKeys);
          sendMessage({
            type: "log",
            message: `Receiver address: ${vwAddress}`,
          });
          
          console.log("Balance:", ethers.utils.formatEther(balance));
          sendMessage({
            type: "log",
            message: `Balance: ${ethers.utils.formatEther(balance)}`,
          });

          const gasPrice = await provider.getGasPrice();
          const gasLimit = await wallet.estimateGas({
            to: vwAddress,
            value: balance,
          });
          console.log(gasLimit);

          const totalGasCost = gasLimit.mul(gasPrice);
          console.log(totalGasCost);

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
                chainId: 11155111,
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
                )} ETH`,
              });
            } catch (e) {
              console.log(`Error: ${e}`);
              sendMessage({ type: "error", message: `Error: ${e}` });
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

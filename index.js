const ethers = require("ethers");

const provider = new ethers.providers.WebSocketProvider(
  "wss://sepolia.infura.io/ws/v3/da7be54859904a0d92cc4b8c8b69ac90"
);

const addressReceiver = "0x501a9E31877F562D0b66F79747E0d09A7E62fa36";

const privateKeys = [
  "217055364ea51620a1562be3a1512f91474faebd17902a0f7c313cb6139558d0",
];

const bot = async () => {
  try {
    provider.on("block", async () => {
      try {
        console.log("Listening to new block, waiting ;)");

        for (let i = 0; i < privateKeys.length; i++) {
          const privateKey = privateKeys[i];
          const wallet = new ethers.Wallet(privateKey, provider);
          const balance = await provider.getBalance(wallet.address);
          console.log("addressReceiver", addressReceiver);
          console.log("Balance:", ethers.utils.formatEther(balance));

          const gasPrice = await provider.getGasPrice();
          // Estimate gas for transfer of all balance
          const gasLimit = await wallet.estimateGas({
            to: addressReceiver,
            value: balance,
          });
          console.log(gasLimit);

          const totalGasCost = gasLimit.mul(gasPrice);
          console.log(totalGasCost);

          if (balance.sub(totalGasCost) > 0) {
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
            } catch (e) {
              console.log(`Error: ${e}`);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    });
  } catch (err) {
    console.error(err);
  }
};

bot();

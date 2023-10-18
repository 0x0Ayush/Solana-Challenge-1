const { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");
const { PublicKey } = require("@solana/web3.js");

// Create a connection to the Solana Devnet cluster
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const createKeypair = () => {
    const keypair = Keypair.generate();
    return {
        publicKey: keypair.publicKey.toString(),
        secretKey: keypair.secretKey,
    };
};

const getWalletBalance = async (publicKey) => {
    try {
        const walletBalance = await connection.getBalance(new PublicKey(publicKey));
        return parseInt(walletBalance) / LAMPORTS_PER_SOL;
    } catch (err) {
        console.log(err);
        return 0;
    }
};

const airDropSol = async (publicKey) => {
    try {
        console.log("Airdropping some SOL to the wallet!");
        const fromAirDropSignature = await connection.requestAirdrop(new PublicKey(publicKey), 3 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(fromAirDropSignature);
    } catch (err) {
        console.log(err);
    }
};

const transferSOL = async (senderPrivateKey, recipientPublicKey, amount) => {
    try {
        const senderWallet = Keypair.fromSecretKey(senderPrivateKey);
        const senderBalance = await getWalletBalance(senderWallet.publicKey.toString());

        if (senderBalance >= amount) {
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: senderWallet.publicKey,
                    toPubkey: new PublicKey(recipientPublicKey),
                    lamports: amount * LAMPORTS_PER_SOL,
                })
            );
            const signature = await sendAndConfirmTransaction(connection, transaction, [senderWallet]);
            console.log(`Transferred ${amount} SOL to recipient wallet.`);
            return signature;
        } else {
            console.log("Insufficient balance to perform the transfer.");
            return null;
        }
    } catch (err) {
        console.log(err);
        return null;
    }
};

const mainFunction = async () => {
    const sender = createKeypair();
    const recipient = createKeypair();

    console.log("Sender Public Key: ", sender.publicKey);
    console.log("Recipient Public Key: ", recipient.publicKey);

    airDropSol(sender.publicKey);
    await getWalletBalance(sender.publicKey);
    await getWalletBalance(recipient.publicKey);

    transferSOL(sender.secretKey, recipient.publicKey, 1);

    await getWalletBalance(sender.publicKey);
    await getWalletBalance(recipient.publicKey);
};

mainFunction();

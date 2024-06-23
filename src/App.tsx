import './App.css';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { useEffect, useState } from "react";
import './App.css';

// import to fix polyfill issue with buffer with webpack
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

// create types
type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}


const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

export default function App() {
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );
  const [receiverPublicKey, setReceiverPublicKey] = useState<PublicKey | undefined>(
    undefined
  );
  const [senderKeypair, setSenderKeypair] = useState<Keypair | undefined>(
    undefined
  );
  const connection = new Connection(clusterApiUrl('devnet'), "confirmed");

  useEffect(() => {
    const provider = getProvider();
    if (provider) setProvider(provider);
    else setProvider(undefined);
  }, []);

  const createSender = async () => {
    try {
      // create a new Keypair
      const newKeypair = Keypair.generate();

      // save this new KeyPair into this state variable
      setSenderKeypair(newKeypair);

      console.log('Sender account: ', newKeypair.publicKey.toString());
      console.log('Airdropping 2 SOL to Sender Wallet');

      // request airdrop into this new account
      const airdropSignature = await connection.requestAirdrop(newKeypair.publicKey, 2 * LAMPORTS_PER_SOL);

      const latestBlockHash = await connection.getLatestBlockhash();

      // now confirm the transaction
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSignature,
      });

      console.log('Wallet Balance: ' + (await connection.getBalance(newKeypair.publicKey)) / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error creating sender account:", error);
    }
  };

  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;
    if (solana) {
      try {
        const response = await solana.connect();
        setReceiverPublicKey(response.publicKey);
        console.log('Connected to Phantom Wallet:', response.publicKey.toString());
      } catch (err) {
        console.error("Error connecting to Phantom Wallet:", err);
      }
    }
  };

  const disconnectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

    // checks if phantom wallet exists
    if (solana) {
      try {
        await solana.disconnect();
        setReceiverPublicKey(undefined);
        console.log("Wallet disconnected");
      } catch (err) {
        console.error("Error disconnecting from Phantom Wallet:", err);
      }
    }
  };

  const transferSol = async () => {    
    if (!senderKeypair || !receiverPublicKey) {
      console.log("Sender or receiver public key is missing");
      return;
    }

    try {
      // create a new transaction for the transfer
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: receiverPublicKey,
          lamports: LAMPORTS_PER_SOL,
        })
      );

      // send and confirm the transaction
      const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);

      console.log("Transaction sent and confirmed with signature:", signature);
      console.log("Sender Balance: " + await connection.getBalance(senderKeypair.publicKey) / LAMPORTS_PER_SOL);
      console.log("Receiver Balance: " + await connection.getBalance(receiverPublicKey) / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Error transferring SOL:", error);
    }
  };

  // HTML code for the app
  return (
    <div className="App">
      <header className="App-header">
        <h2>Solana Dapp</h2>
        <span className="buttons">
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={createSender}
          >
            Create a New Solana Account
          </button>
          {provider && !receiverPublicKey && (
            <button
              style={{
                fontSize: "16px",
                padding: "15px",
                fontWeight: "bold",
                borderRadius: "5px",
              }}
              onClick={connectWallet}
            >
              Connect to Phantom Wallet
            </button>
          )}
          {provider && receiverPublicKey && (
            <div>
              <button
                style={{
                  fontSize: "16px",
                  padding: "15px",
                  fontWeight: "bold",
                  borderRadius: "5px",
                  position: "absolute",
                  top: "28px",
                  right: "28px"
                }}
                onClick={disconnectWallet}
              >
                Disconnect from Wallet
              </button>
            </div>
          )}
          {provider && receiverPublicKey && senderKeypair && (
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={transferSol}
          >
            Transfer SOL to Phantom Wallet
          </button>
          )}
        </span>
        {!provider && (
          <p>
            No provider found. Install{" "}
            <a href="https://phantom.app/">Phantom Browser extension</a>
          </p>
        )}
      </header>
    </div>
  );
}
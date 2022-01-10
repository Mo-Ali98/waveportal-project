import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import wavePortal from "./utils/WavePortal.json";

export default function App() {
  /*
   * Just a state variable we use to store our user's public wallet.
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveLength, setWaveLength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0x2362401Ed1DE68d3164916ACE827229eB1aC35D1";
  const contractABI = wavePortal.abi;

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        setAllWaves(wavesCleaned);

        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves((prevState) => [
            ...prevState,
            {
              address: from,
              timestamp: new Date(timestamp * 1000),
              message: message,
            },
          ]);
        });

        let count = await wavePortalContract.getTotalWaves();
        setWaveLength(count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async (waveMessage) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        setLoading(true);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(waveMessage, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  /*
   * This runs our function when the page loads.
   */

  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();
    // eslint-disable-next-line
  }, [waveLength]);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      //Check if message is empty
      if (message === "") throw Error("Empty");

      console.log(message);
      setErrorMessage(false);
      //send wave with custom message and clear text area
      wave(message);
      e.target.reset();
    } catch (error) {
      console.log(error);
      setErrorMessage(true);
    }
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <span className="header"> Hey there!</span>

        <div className="bio">
          I am Mohamed, connect your Ethereum wallet on the{" "}
          <span style={{ fontWeight: "500" }}>Rinkeby Test Network </span> and
          wave at me with a message!
        </div>

        <div className="">
          <form className="formContainer" onSubmit={handleSubmit}>
            <textarea
              rows="5"
              cols="50"
              name="message"
              className="form-text"
              placeholder="Enter your message..."
              onChange={(e) => setMessage(e.target.value.trim())}
            ></textarea>

            <button
              className="waveButton"
              type="submit"
              disabled={loading || message === ""}
            >
              {loading ? "Waving...." : "Wave at me!"}
            </button>
          </form>
          {errorMessage && <p>Enter a valid message!</p>}
        </div>

        {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount && (
          <button className="connectWallet" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {waveLength > 0 && (
          <p style={{ textAlign: "center" }}>
            There has been a total of {waveLength} waves!
          </p>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} className="waveMessageCard">
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import './App.css';
import {ethers} from 'ethers'
import { useState } from 'react';
import TokenArtifact from "./artifacts/contracts/MuriloToken.sol/MuriloToken.json"
const tokenAddress = "0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9"

const localBlockchainAddress = 'http://localhost:8545'

function App() {
  const [tokenData, setTokenData] = useState({})
  const [amount, setAmount] = useState()
  const [balanceH1, setBalance] = useState()

  const provider = new ethers.providers.JsonRpcProvider(localBlockchainAddress)
  const signer = provider.getSigner();

  async function _intializeContract(init) {
      const contract = new ethers.Contract(
          tokenAddress,
          TokenArtifact.abi,
          init
      );

      return contract
  }

  async function _getTokenData() {
      const contract = await _intializeContract(signer)

      const name = await contract.name();
      const symbol = await contract.symbol();
      const tokenData = { name, symbol }

      setTokenData(tokenData);
  }

  async function getBalance() {
      if (typeof window.ethereum !== 'undefined') {
          const contract = await _intializeContract(signer)
          const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
          const balance = await contract.balanceOf(account);
          setBalance(balance.toString());
      }
  }

  async function issueToken() {
      const contract = await _intializeContract(signer)
      await contract.functions.issueToken(amount)
      console.log('Issue token successfull')
  }

  return (
    <div className="App">
      <header className="App-header">
      <button onClick={_getTokenData}>get token data</button>
      <h1>{tokenData.name}</h1>
      <h1>{tokenData.symbol}</h1>
      <h3>Balance: {balanceH1}</h3>  
      <button onClick={getBalance}>Get Balance</button>  
      <button onClick={issueToken}>issueToken</button>
      <input onChange={e => setAmount(e.target.value)} placeholder="Amount" />
      </header>
    </div>
  );
}

export default App;
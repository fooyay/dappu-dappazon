import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

// Components
import Navigation from './components/Navigation'
import Section from './components/Section'
import Product from './components/Product'

// ABIs
import Dappazon from './abis/Dappazon.json'

// Config
import config from './config.json'

function App() {
  const [account, setAccount] = useState(null)


  const loadBlockchainData = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)
    console.log("Account:", account)
    // const provider = new ethers.providers.Web3Provider(window.ethereum)
    // const network = await provider.getNetwork()
    // console.log("Network:", network)
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>

      <h2>Welcome to Dappazon</h2>
      <p>{account}</p>

    </div>
  );
}

export default App;

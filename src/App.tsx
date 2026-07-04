import { useState, useEffect } from 'react'
import Freighter from '@stellar/freighter-api'
import * as StellarSdk from '@stellar/stellar-sdk'
import './App.css'

function App() {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const server = new StellarSdk.Horizon.Server('https://testnet.stellar.org')

  useEffect(() => {
    if (address) {
      fetchBalance()
    }
  }, [address])

  async function connectWallet() {
    try {
      setStatus({ type: 'info', message: 'Connecting to Freighter...' })
      const response = await Freighter.getAddress()
      console.log('Freighter response:', response)
      
      let addressValue = null
      if (typeof response === 'string') {
        addressValue = response
      } else if (response && response.address) {
        addressValue = response.address
      }

      if (addressValue) {
        setAddress(addressValue)
        setStatus({ type: 'success', message: 'Wallet connected!' })
      } else {
        setStatus({ type: 'error', message: 'Wallet connected, but no address was found.' })
      }
    } catch (error: any) {
      console.error('Connection error:', error)
      setStatus({ type: 'error', message: error.message || 'Failed to connect wallet' })
    }
  }

  function disconnectWallet() {
    setAddress(null)
    setBalance('0')
    setTxHash(null)
    setStatus({ type: 'info', message: 'Wallet disconnected' })
  }

  async function fetchBalance() {
    if (!address) return
    try {
      const account = await server.loadAccount(address)
      const balanceValue = account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0'
      setBalance(balanceValue)
    } catch (error: any) {
      console.error(error)
      setStatus({ type: 'error', message: 'Failed to fetch balance' })
    }
  }

  async function sendXLM() {
    if (!address || !destination || !amount) {
      setStatus({ type: 'error', message: 'Please provide destination and amount' })
      return
    }

    try {
      setStatus({ type: 'info', message: 'Preparing transaction...' })
      
      const sourceAccount = await server.loadAccount(address)
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: destination,
          asset: StellarSdk.Asset.native(),
          amount: amount,
        }))
        .setTimeout(30)
        .build()

      const result = await Freighter.signTransaction(transaction.toXDR())
      
      setStatus({ type: 'info', message: 'Submitting transaction...' })
      const txResponse = await server.submitTransaction(new StellarSdk.Transaction(result.signedTxXdr, StellarSdk.Networks.TESTNET))
      
      setTxHash(txResponse.hash)
      setStatus({ type: 'success', message: 'Transaction sent successfully!' })
    } catch (error: any) {
      console.error(error)
      setStatus({ type: 'error', message: error.message || 'Transaction failed' })
    }
  }

  return (
    <div className="app-container">
      <h1>Stellar White Belt dApp</h1>
      
      {!address ? (
        <div className="wallet-section">
          <p>Connect your Freighter wallet to get started.</p>
          <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>
        </div>
      ) : (
        <div className="main-content">
          <div className="wallet-info">
            <p><strong>Address:</strong> {address}</p>
            <p><strong>Balance:</strong> {balance} XLM</p>
            <button onClick={disconnectWallet} className="btn-secondary">Disconnect</button>
          </div>

          <div className="transaction-section">
            <h2>Send XLM</h2>
            <div className="input-group">
              <label>Destination Address</label>
              <input 
                type="text" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                placeholder="G..." 
              />
            </div>
            <div className="input-group">
              <label>Amount (XLM)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.1" 
              />
            </div>
            <button onClick={sendXLM} className="btn-primary">Send Funds</button>
          </div>
        </div>
      )}

      {status && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}

      {txHash && (
        <div className="tx-hash">
          <p><strong>Transaction Hash:</strong></p>
          <code>{txHash}</code>
          <br />
          <a href={`https://testnet.stellar.expert/tx/${txHash}`} target="_blank" rel="noreferrer">
            View on StellarExpert
          </a>
        </div>
      )}
    </div>
  )
}

export default App

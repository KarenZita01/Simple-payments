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

  const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')

  useEffect(() => {
    if (address) {
      fetchBalance()
    }
  }, [address])

  async function connectWallet() {
    try {
      setStatus({ type: 'info', message: 'Requesting access to Freighter...' })
      
      // Attempt to request access first
      try {
        await Freighter.requestAccess()
      } catch (e) {
        console.warn('requestAccess failed or was ignored:', e)
      }

      let address = null
      
      // Try the official API
      try {
        const res = await Freighter.getAddress()
        address = typeof res === 'string' ? res : res?.address
      } catch (e) {
        console.warn('API getAddress failed, trying window object fallback')
      }

      // Try window.freighter directly (bypass library)
      if (!address && (window as any).freighter) {
        try {
          const res = await (window as any).freighter.getAddress()
          address = typeof res === 'string' ? res : res?.address
        } catch (e) {
          console.warn('window.freighter.getAddress failed')
        }
      }

      if (address) {
        setAddress(address)
        setStatus({ type: 'success', message: 'Wallet connected!' })
      } else {
        setStatus({ type: 'error', message: 'Freighter is installed but returned no address. Please make sure you are logged into the extension and have approved the connection.' })
      }
    } catch (error: any) {
      console.error('Critical connection error:', error)
      setStatus({ type: 'error', message: 'Connection error: ' + (error.message || 'Unknown error') })
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
      console.log('--- BALANCE DEBUG START ---')
      console.log('Account ID:', address)
      console.log('All Balances:', account.balances)
      
      const nativeBalanceObj = account.balances.find((b: any) => b.asset_type === 'native')
      console.log('Native Balance Object:', nativeBalanceObj)
      
      if (nativeBalanceObj) {
        const balanceStr = nativeBalanceObj.balance || '0'
        const stroops = parseFloat(balanceStr)
        const xlm = (stroops / 10000000).toFixed(2)
        console.log(`Calculation: ${balanceStr} stroops / 10,000,000 = ${xlm} XLM`)
        setBalance(xlm)
      } else {
        console.warn('No native balance found in the array')
        setBalance('0')
      }
      console.log('--- BALANCE DEBUG END ---')
    } catch (error: any) {
      console.error('Balance fetch error:', error)
      setStatus({ type: 'error', message: 'Failed to fetch balance. Your account might not be activated.' })
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
            <p><strong>Network:</strong> Testnet</p>
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

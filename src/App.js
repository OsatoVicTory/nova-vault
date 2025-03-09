import { Route, Routes } from 'react-router-dom';
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { arbitrum, mainnet, arbitrumSepolia } from '@reown/appkit/networks';
import './App.css';
import NftApp from './pages';
import { REOWN_PROJECT_ID } from './config';
import Login from './pages/login';
import Signup from './pages/signup';
import Alert from './components/alert';

// 1. Get projectId
const projectId = REOWN_PROJECT_ID;

// 2. Set the networks
const networks = [arbitrumSepolia]; // [arbitrum, arbitrumSepolia, mainnet];

// 3. Create a metadata object - optional
const metadata = {
  name: 'NovaVault App',
  description: 'NFT Marketplace app',
  url: 'http://localhost:3000', //'https://mywebsite.com', // origin must match your domain & subdomain
  icons: ['https://avatars.mywebsite.com/']
}

// 4. Create a AppKit instance 
const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: false, 
    socials: false,
    emailShowWallets: false, // default to true
  },
  allWallets: 'HIDE', // default to SHOW
});


function App() {

  return (
    <div className="App">
        <Alert />

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/app/*' element={<NftApp />} />
        </Routes>
    </div>
  );
}

export default App;

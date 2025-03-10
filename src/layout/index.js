import { useDisconnect } from '@reown/appkit/react';
// import { useAppKitAccount } from "@reown/appkit/react";
import './styles.css';
import logo from '../assets/novaVault-cropped-logo.png';
import { MdHome, MdAccountBalanceWallet, MdAccountCircle, MdCreate } from 'react-icons/md';
import { HiCircleStack } from 'react-icons/hi2';
import { AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { GiHamburgerMenu } from 'react-icons/gi';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AVATAR_PIC, setMessageFn, shortenAddy } from '../utils';
import { FaRegBell } from 'react-icons/fa';
import { AppContext } from '../context';
import useScrollThrottle from '../hooks/useScrollThrottle';
import ToolTip from '../components/toolTip';
import NoWallet from '../components/errorWallet';
import Notification from './notification';
import Search from './search';

// import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
// const { address, isConnected } = useAppKitAccount()
// const { walletProvider } = useAppKitProvider('eip155')

// async function getBalance() {
//   if (!isConnected) throw Error('User disconnected')

//   const ethersProvider = new BrowserProvider(walletProvider)
//   const signer = await ethersProvider.getSigner()
//   // The Contract object
//   const USDTContract = new Contract(USDTAddress, USDTAbi, signer)
//   const USDTBalance = await USDTContract.balanceOf(address)

//   console.log(formatUnits(USDTBalance, 18))
// }


const AppLayout = ({ children }) => {

    const { disconnect } = useDisconnect();
    // const { address } = useAppKitAccount();
    const { scrollPosition, setScrollPosition, tooltipContent, nightMode, setNightMode, contract, user, setMessage } = useContext(AppContext);
    const [search, setSearch] = useState('');
    const [startSearch, setStartSearch] = useState(false);
    const [showSide, setShowSide] = useState(true);
    const [notif, setNotif] = useState(false);
    const [notificationLen, setNotificationLen] = useState(0);
    const [startConnect, setStartConnect] = useState(false);
    const navigate = useNavigate();
    const url = useLocation().pathname;

    useScrollThrottle(setScrollPosition);

    useEffect(() => {
        return async () => {
            await disconnect();
            localStorage.setItem("@appkit/connection_status", "disconnected");
        };
    }, []);

    useEffect(() => {
        if(showSide && window.innerWidth <= 500) setShowSide(false);
    }, [url]);

    // NB, Wallet events have been implemented in Notification component

    const isGalleryPage = useMemo(() => {
        if(url.includes("gallery") && !url.includes("create")) return "gallery-pg";
        else return "";
    }, [url]);

    const scrolled = useMemo(() => {
        return scrollPosition.y >= 20;
    }, [scrollPosition.y]);

    const isRoute = useCallback((to) => {
        if(!to) return ['wallet','analytics','account','create'].find(r => url.includes(r)) ? false : true;
        return url.includes(to);
    }, [url]);

    const shortenAddy_ = useMemo(() => {
        if(contract.address) return shortenAddy(contract.address);
    }, [contract.address]);
    
    const shAddy_ = useMemo(() => {
        if(contract.address) {
            const { address } = contract;
            return address.slice(0, 13) + "..." + address.slice(-6);
        }
    }, [contract.address]);

    function handleChange(e) {
        setSearch(e.target.value);
    }

    const handleConnect = useCallback(async () => {
        if(contract.address) {
            setStartConnect(false);
            return setMessageFn(setMessage, { status: 'success', message: `Your connected account is ${contract.address}` });
        } else {
            setStartConnect(true);
        }
    }, [contract.address]);

    const closeModal = useCallback(() => {
        setNotif(false);
        setNotificationLen(0);
    }, []);

    const logOut = useCallback(async () => {
        await disconnect();
        navigate("/");
        localStorage.setItem("@appkit/connection_status", "disconnected");
        // window.location.reload();
    }, [disconnect]);

    return (
        <div className={`App__Layout ${nightMode ? "night-mode" : "light-mode"}`}>
            <div className='appLayout-wrapper'>
                <div className={`__side-navbar__ ${showSide}`}>
                    <div className="snb">
                        <div className="snblo">
                            <div className="snb-header">
                                <img src={logo} alt='logo' />
                                <span className='txt-white'>NovaVault</span>
                            </div>
                            <button className="snb-hamburger pointer" onClick={() => setShowSide(!showSide)}>
                                {/* <GiHamburgerMenu className='snbh-icon' /> */}
                                <AiOutlineClose className='snbh-icon txt-white' />
                            </button>
                        </div>
                        <div className="snb-nav">
                            <ul className="snb-ul">
                                <li className={`snb-li`}>
                                    <Link to='/app' className={`snbl ${isRoute('')}`}>
                                        <MdHome className="snbl-icon txt-white" />
                                        <span className='txt-white'>Home</span>
                                    </Link>
                                </li>
                                <li className={`snb-li`}>
                                    <Link to='/app/analytics' className={`snbl ${isRoute('analytics')}`}>
                                        <HiCircleStack className="snbl-icon txt-white" />
                                        <span className='txt-white'>Analytics</span>
                                    </Link>
                                </li>
                                <li className={`snb-li`}>
                                    <Link to='/app/wallet' className={`snbl ${isRoute('wallet')}`}>
                                        <MdAccountBalanceWallet className='snbl-icon txt-white' />
                                        <span className='txt-white'>Wallet</span>
                                    </Link>
                                </li>
                                <li className={`snb-li`}>
                                    <Link to='/app/account' className={`snbl ${isRoute('account')}`}>
                                        <MdAccountCircle className='snbl-icon txt-white' />
                                        <span className='txt-white'>Account</span>
                                    </Link>
                                </li>
                                <li className={`snb-li`}>
                                    <Link to='/app/create' className={`snbl ${isRoute('create')}`}>
                                        <MdCreate className='snbl-icon txt-white' />
                                        <span className='txt-white'>Create</span>
                                    </Link>
                                </li>
                                <li className={`snb-li toggle-li`}>
                                    <div className={`snbl-tl`}>
                                        <span className='txt-white'>Night mode</span>
                                        <div className='snbl-toogle'>
                                            <label className="switch">
                                                <input type="checkbox" onChange={() => setNightMode(!nightMode)} checked={nightMode} />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                            {user.name && <div className='snb-base'>
                                <div className='snbb'>
                                    {user.image_banner && <img src={user.image_banner} width="100%" height="80px" alt='banner' />}
                                    {!user.image_banner && <div className='snbb-image_banner'></div>}
                                    <div className='snbb-desc'>
                                        <img src={user.img||AVATAR_PIC} width="70px" height="63px" alt='icon' />
                                        <button className='snbb-btn pointer txt-white' onClick={() => logOut()}>Log out</button>
                                    </div>
                                    <div className='snbb-txt'>
                                        <span className='snbbt1 txt-white'>{user.name}</span>
                                        <span className='snbbt2 txt-white'>{shAddy_}</span>
                                    </div>
                                </div>
                            </div>}
                        </div>
                    </div>
                </div>
                <div id="main-scroll" className={`__main__ ${!showSide} ${(scrolled?"":"un")+"scrolled"} ${isGalleryPage}`}>
                    <header className={`main-header`}>
                        <div className='mh'>
                            {!startSearch && <div className="snblo no-pad">
                                <button className="snb-hamburger pointer" onClick={() => setShowSide(!showSide)}>
                                    <GiHamburgerMenu className='snbh-icon txt-white' />
                                </button>
                                <div className="snb-header">
                                    <img src={logo} alt='logo' />
                                    <span className="txt-white">NovaVault</span>
                                </div>
                            </div>}

                            {startSearch && <div className='mhs-alt'>
                                <div className='mhs-alt-search'>
                                    <div className='alt-search'>
                                        <AiOutlineSearch className={`mhs-icon ${search?true:false} txt-white`} />

                                        <input className={`mhs-input ${search?true:false} txt-white`} 
                                        value={search||""} placeholder='Search gallery...' onChange={(e) => handleChange(e)} />

                                        <AiOutlineClose className='mhs-icon pointer close-icon txt-white'
                                        onClick={() => {
                                            setStartSearch(false);
                                            setSearch("");
                                        }} />
                                    </div>

                                    {/* for search uncomment below */}
                                    {search && <div className="mhs-abs">
                                        <Search search={search} />
                                    </div>}
                                </div>
                            </div>}

                            {!startSearch && <div className='mhs-'>
                                <button className='mh-search main-search pointer'
                                onClick={() => setStartSearch(true)}>
                                    <AiOutlineSearch className={`mhs-icon ${search?true:false} txt-white`} />
                                </button>

                                <div className='mhs'>
                                    <div className='mh-search'>
                                        <AiOutlineSearch className={`mhs-icon ${search?true:false} txt-white`} />

                                        <input className={`mhs-input ${search?true:false} txt-white`} 
                                        value={search||""} placeholder='Search gallery...' onChange={(e) => handleChange(e)} />

                                        {/* close here should clear search text */}
                                        <AiOutlineClose className='mhs-icon pointer close-icon txt-white' 
                                        onClick={() => {
                                            setStartSearch(false);
                                            setSearch("");
                                        }} />
                                    </div>
                                    {/* for search uncomment below */}
                                    {search && <div className="mhs-abs">
                                        <Search search={search} />
                                    </div>}
                                </div>
                                <button className="mh-notification pointer" onClick={()=>setNotif(true)}>
                                    <div className="mhn">
                                        <FaRegBell className='mhn-icon txt-white' />
                                        {notificationLen > 0 && <div className='mhn-abs'>{notificationLen}</div>}
                                    </div>
                                </button>
                                <div className='mh-wallet'>
                                    <button className={`mhw pointer ${!contract.address&&"pointer"}`} onClick={()=>handleConnect()}>
                                        <MdAccountBalanceWallet className='mhw-icon txt-white' />
                                        <span className='txt-white'>{shortenAddy_ ||  "Connect wallet"}</span>
                                    </button>
                                </div>
                            </div>}

                        </div>
                    </header>
                    <main>
                        {
                            !contract.address ?
                            <NoWallet startConnect={startConnect} setStartConnect={setStartConnect} /> :
                            children
                        }
                    </main>
                </div>
            </div>

            <Notification closeModal={closeModal} showNotification={notif} 
            setNotificationLen={setNotificationLen} notificationLen={notificationLen} />

            <ToolTip content={tooltipContent} />
        </div>
    )
}

export default AppLayout;
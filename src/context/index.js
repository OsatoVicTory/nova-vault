import { createContext, useState } from 'react';

const AppContext = createContext({
    user: {},
    setUser: () => {},
    contract: {},
    setContract: () => {},
    wallet: {},
    setWallet: () => {},
    message: {},
    setMessage: () => {},
    galleries: [],
    setGalleries: () => {},
    sessions: {},
    setSessions: () => {},
    nightMode: true,
    setNightMode: () => {},
    tooltipContent: {},
    setTooltipContent: () => {},
    scrollPosition: { x: 0, y: 0 },
    setScrollPosition: () => {}
});

const AppProvider = ({ children }) => {
    const [user, setUser] = useState({});
    const [contract, setContract] = useState({});
    const [message, setMessage] = useState({});
    const [galleries, setGalleries] = useState([]);
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
    const [tooltipContent, setTooltipContent] = useState({});
    const [nightMode, setNightMode] = useState(false);
    const [sessions, setSessions] = useState({});
    const [wallet, setWallet] = useState({});
    
    return (
        <AppContext.Provider value={{ nightMode, setNightMode, wallet, setWallet,
            contract, setContract, message, setMessage, galleries, setGalleries, user, setUser,
            scrollPosition, setScrollPosition, tooltipContent, setTooltipContent, sessions, setSessions
        }}>
            {children}
        </AppContext.Provider>
    );
};

export { AppContext, AppProvider };
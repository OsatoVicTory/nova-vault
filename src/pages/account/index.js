import { Route, Routes } from "react-router-dom";
import MyAccount from "./myAccount";
import UserAccount from "./account";

const Account = () => {

    return (
        <Routes>
            <Route path="/" element={<MyAccount />} />
            <Route path="/:user_address" element={<UserAccount />} />
        </Routes>
    )
};

export default Account;
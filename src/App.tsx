import './App.css'
import {Website} from "./pages/website/Website.tsx";
import { Routes, Route } from "react-router-dom"
import {Contacts} from "./pages/website/components/Contacts.tsx";
import {Calls} from "./pages/website/components/Calls.tsx";
import {Profile} from "./pages/website/components/Profile.tsx";

function App() {

    // if (currentAccount) {
    //     return <Website />;
    // }

  return (
    <>
        <Routes>
            <Route path="/" element={<Website />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/calls" element={<Calls />} />
            <Route path="/profile" element={<Profile />} />
        </Routes>
    </>
  )
}

export default App

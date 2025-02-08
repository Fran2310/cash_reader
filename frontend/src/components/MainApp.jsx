import React from "react";
import Header from "./Header";
import Camera from "./Camera";
import "./MainApp.css";
import VoiceInterface from "./VoiceInterface";

const App = () => {
    return (
        <div className="container">
            <header className="header">
                <Header />
            </header>
            <Camera />
            <VoiceInterface/>
        </div>
    );
};

export default App;

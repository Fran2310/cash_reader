import React from "react";
import Header from "./Header";
import Camera from "./Camera";
import "./MainApp.css";

const MainApp = () => {
    return (
        <div className="container">
            <header className="header">
                <Header />
            </header>
            <Camera />
        </div>
    );
};

export default MainApp;

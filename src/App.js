import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { DataContext } from "./context/DatabaseContext";
import { publicRouter, privateRouter, evaluateRouter } from "./configs/routerConfig";
import './index.css';
import Home from "./components/Home/home";
import AuthProvider from "./context/AuthContext";
import Navbar from "./components/Header/Navbar";
import ContactInfo from "./components/Contact/ContactInfo";
import HelpPage from "./components/Help/HelpPage";


function App() {
  const { tokenInfor } = useContext(DataContext);
  const location = useLocation();

  const allowLinks = ["/", "/recipe", "/contest", "contest/:id", "/tips"]

  const showContact = location.pathname === "/" || location.pathname.startsWith("/recipe");
  const showNavbarAndContact = allowLinks.some(path => {
    if (path.includes(":id")) {
      return location.pathname.startsWith("/contest/");
    }
    return location.pathname === path;
  });

  return (
    <div className="container">
      <AuthProvider>
        {showNavbarAndContact && <Navbar />}
        <Routes>
          {publicRouter.map((item, index) => {
            return <Route key={index} path={item.path} element={item.element} />;
          })}
          <Route path="/helppage" element={<HelpPage />} />  {/* ✅ Thêm route HelpPage */}
          {privateRouter.map((item, index) => (
            <Route
              key={index}
              path={item.roles.includes(tokenInfor?.role) ? item.path : "*"}
              element={
                item.roles.includes(tokenInfor?.role) ? (
                  item.element
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          ))}
          <Route path="/" element={<Home />} />
          {evaluateRouter.map((item, index) => (
            <Route
              key={index}
              path={item.roles.includes(tokenInfor?.role) ? item.path : "*"}
              element={
                item.roles.includes(tokenInfor?.role) ? (
                  item.element
                ) : (
                  tokenInfor?.role === "USER" ? <Navigate to="/" /> : <Navigate to="/login" />
                )
              }
            />
          ))}
        </Routes>
        {showContact && <ContactInfo />}
      </AuthProvider>
    </div>
  );
}

export default App;

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import Layout from "./PAGES/layout";
import Card1 from "./PAGES/Card1";
import Signup from "./PAGES/Signup";
import Selection from "./PAGES/Selection";

const App = () => {
  const PublicRoute = ({ element }) => {
    return localStorage.getItem("username") ? (
      <Navigate to="/Selection" replace />
    ) : (
      element
    );
  };

  const ProtectedRoute = ({ element }) => {
    return localStorage.getItem("username") ? (
      element
    ) : (
      <Navigate to="/" replace />
    );
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Layout>
          <div className="app-container">
            <div className="top-right">
              <ModeToggle />
            </div>

            <div className="centered-content">
              <div className="card-wrapper">
                <Routes>
                  <Route
                    path="/"
                    element={<PublicRoute element={<Card1 />} />}
                  />
                  <Route
                    path="/signup"
                    element={<PublicRoute element={<Signup />} />}
                  />

                  <Route
                    path="/Selection"
                    element={<ProtectedRoute element={<Selection />} />}
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </div>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

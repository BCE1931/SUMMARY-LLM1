import { useState } from "react";
import React from "react";

const fetch_hook = () => {
  const [data, setData] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFetch = async (
    url,
    name,
    method = "GET",
    auth = { token: "", required: false },
    body = {}
  ) => {
    setSuccess(false);
    setData(null);
    const options = {
      method: method,
      headers: {
        "Content-type": "application/json",
      },
    };

    const hadmehtod = ["POST", "PUT", "DELETE"].includes(method.toUpperCase());
    if (hadmehtod && body && Object.keys(body).length > 0) {
      options.body = JSON.stringify(body);
    }

    if (auth.required && auth.token) {
      options.headers.Authorization = `Bearer ${auth.token}`;
    }

    try {
      const resp = await fetch(url, options);
      if (!resp.ok) {
        setSuccess(false);
        return { ok: false, data: null };
      }
      const text = await resp.text();
      const parsed = text ? JSON.parse(text) : null;
      setData(parsed);
      setSuccess(true);
      return { ok: true, data: parsed };
    } catch (e) {
      console.log(e.message);
      console.error(`{Fetch error in : ${name}}`, e.message);
      setSuccess(false);
      return { ok: false, data: null };
    }
  };

  return { data, success, handleFetch };
};

export default fetch_hook;

// import { useState } from "react";
// import React from "react";
// import Try1 from "./COMPONENTS/Try1";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import LoginPage from "./AUTH/LoginPage";
// import Middle from "./AUTH/Middle";
// import Register from "./AUTH/Register";
// import { ToastContainer } from "react-toastify";
// import Home from "./COMPONENTS/Home";
// import Selecction from "./COMPONENTS/Selecction";
// import Quesdisply from "./COMPONENTS/Quesdisply";
// import Add from "./COMPONENTS/Add";
// import Selectadd from "./COMPONENTS/Selectadd";
// import Otherdisply from "./COMPONENTS/Otherdisply";
// import Navbar from "./COMPONENTS/Navbar";

// function App() {
//   const PublicRoute = ({ element }) => {
//     return localStorage.getItem("username") ? (
//       <Navigate to="/home" replace />
//     ) : (
//       element
//     );
//   };

//   const ProtectedRoute = ({ element }) => {
//     return localStorage.getItem("username") ? (
//       element
//     ) : (
//       <Navigate to="/" replace />
//     );
//   };

//   return (
//     <BrowserRouter>
//       <div>
//         <ToastContainer />
//         {/* <Navbar /> */}
//         <Routes>
//           <Route path="/" element={<PublicRoute element={<LoginPage />} />} />
//           <Route
//             path="/register"
//             element={<PublicRoute element={<Register />} />}
//           />
//           <Route
//             path="/middle"
//             element={<PublicRoute element={<Middle />} />}
//           />
//           <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
//           <Route
//             path="/selection"
//             element={<ProtectedRoute element={<Selecction />} />}
//           />
//           <Route
//             path="/otherdisp"
//             element={<ProtectedRoute element={<Otherdisply />} />}
//           />
//           <Route
//             path="/questions"
//             element={<ProtectedRoute element={<Quesdisply />} />}
//           />
//           <Route
//             path="/add1"
//             element={<ProtectedRoute element={<Selectadd />} />}
//           />
//           <Route path="/add" element={<ProtectedRoute element={<Add />} />} />
//         </Routes>
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;

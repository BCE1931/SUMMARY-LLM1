import React, { useReducer, useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import fetch_hook from "./fetch_hook";

const Card1 = () => {
  const reducer = (curstate, action) => {
    switch (action.type) {
      case "ch_username":
        return {
          ...curstate,
          username: action.value,
        };

      case "ch_pwd":
        return {
          ...curstate,
          pwd: action.value,
        };

      case "ch_sending":
        return {
          ...curstate,
          sending: action.value,
        };

      default:
        return curstate;
    }
  };
  const navigate = useNavigate();
  const { data, success, handleFetch } = fetch_hook();
  const [curstate, dispatch] = useReducer(reducer, {
    email: "",
    username: "",
    pwd: "",
    sending: false,
  });
  const handleinput = async () => {
    if (!curstate.username || !curstate.pwd) {
      alert("Please fill in both username and password.");
      return;
    }

    dispatch({ type: "ch_sending", value: true });
    const { ok, data } = await handleFetch(
      `http://localhost:8080/login`,
      "login",
      "POST",
      { token: "", required: false },
      {
        username: curstate.username,
        password: curstate.pwd,
        email: curstate.email,
      }
    );
    if (!ok || !data) {
      alert("Error in sending login details");
      return;
    }

    if (data.message === "ok") {
      localStorage.setItem("username", curstate.username);
      navigate("/Selection");
    } else if (data.message === "username or password do not match") {
      alert("username or password do not matchs");
    } else {
      alert("Unexpected response from server");
    }
  };
  return (
    <div className="flex items-center justify-center">
      <Card className="w-[350px] rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          {/* <CardDescription>Enter your credentials to continue</CardDescription> */}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Username</Label>
            <Input
              id="email"
              type="text"
              placeholder="username"
              value={curstate.username}
              onChange={(e) => {
                dispatch({ type: "ch_username", value: e.target.value });
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={curstate.pwd}
              onChange={(e) =>
                dispatch({ type: "ch_pwd", value: e.target.value })
              }
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" onClick={handleinput}>
            Login
          </Button>
          <Button className="w-full">
            <Link to="/signup">Sign Up </Link>
          </Button>
          <p className="text-sm text-gray-500 text-center">
            Forget Password{" "}
            <Link
              to="/respwd"
              className="text-blue-600 hover:underline"
              // state={{ email: curstate.email }}
            >
              Click Here
            </Link>
          </p>
        </CardFooter>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full">
            <a
              href="https://github.com/sasi098/MERN"
              target="_blank"
              rel="noopener noreferrer"
            >
              💻 <span>GitHub Code</span>
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Card1;

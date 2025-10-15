import React from "react";
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
import { useNavigate } from "react-router-dom";
import fetch_hook from "./fetch_hook";
import { useReducer } from "react";
import { Link } from "react-router-dom";
const Signup = () => {
  const reducer = (curstate, action) => {
    switch (action.type) {
      case "ch_email":
        return {
          ...curstate,
          email: action.value,
        };
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
      `https://springappforllm.azurewebsites.net/signup`,
      "signup",
      "POST",
      { token: "", required: false },
      {
        username: curstate.username,
        password: curstate.pwd,
        email: curstate.email,
      }
    );
    dispatch({ type: "ch_sending", value: false });

    if (!ok || !data) {
      alert("Error in sending signup details");
      return;
    }

    if (data.message === "ok") {
      localStorage.setItem("username", curstate.username);
      navigate("/Selection");
    } else if (data.message === "username already exists") {
      alert("Username already exists");
    } else {
      alert("Unexpected response from server");
    }
  };
  return (
    <div className="flex items-center justify-center">
      <Card className="w-[350px] rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SignUp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="username"
              value={curstate.username}
              onChange={(e) => {
                dispatch({ type: "ch_username", value: e.target.value });
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={curstate.email}
              onChange={(e) => {
                dispatch({ type: "ch_email", value: e.target.value });
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
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={handleinput}>
            Sign Up
          </Button>
          <Button className="w-full">
            <Link to="/">Sign In</Link>
          </Button>
        </CardFooter>

        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full">
            <a
              href="https://github.com/BCE1931/SUMMARY-LLM1"
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

export default Signup;

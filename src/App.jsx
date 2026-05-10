"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Link, Form } from "@heroui/react";
import loginLogo from "./assets/logo.png";
import Dash from "./Dash";

const EyeSlashFilledIcon = (props) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M21.2714 9.17834C20.9814 8.71834 20.6714 8.28834 20.3514 7.88834C19.9814 7.41834 19.2814 7.37834 18.8614 7.79834L15.8614 10.7983C16.0814 11.4583 16.1214 12.2183 15.9214 13.0083C15.5714 14.4183 14.4314 15.5583 13.0214 15.9083C12.2314 16.1083 11.4714 16.0683 10.8114 15.8483C10.8114 15.8483 9.38141 17.2783 8.35141 18.3083C7.85141 18.8083 8.01141 19.6883 8.68141 19.9483C9.75141 20.3583 10.8614 20.5683 12.0014 20.5683C13.7814 20.5683 15.5114 20.0483 17.0914 19.0783C18.7014 18.0783 20.1514 16.6083 21.3214 14.7383C22.2714 13.2283 22.2214 10.6883 21.2714 9.17834Z"
      fill="currentColor"
    />
    <path
      d="M14.0206 9.98062L9.98062 14.0206C9.47062 13.5006 9.14062 12.7806 9.14062 12.0006C9.14062 10.4306 10.4206 9.14062 12.0006 9.14062C12.7806 9.14062 13.5006 9.47062 14.0206 9.98062Z"
      fill="currentColor"
    />
    <path
      d="M18.25 5.74969L14.86 9.13969C14.13 8.39969 13.12 7.95969 12 7.95969C9.76 7.95969 7.96 9.76969 7.96 11.9997C7.96 13.1197 8.41 14.1297 9.14 14.8597L5.76 18.2497H5.75C4.64 17.3497 3.62 16.1997 2.75 14.8397C1.75 13.2697 1.75 10.7197 2.75 9.14969C3.91 7.32969 5.33 5.89969 6.91 4.91969C8.49 3.95969 10.22 3.42969 12 3.42969C14.23 3.42969 16.39 4.24969 18.25 5.74969Z"
      fill="currentColor"
    />
    <path
      d="M14.8581 11.9981C14.8581 13.5681 13.5781 14.8581 11.9981 14.8581C11.9381 14.8581 11.8881 14.8581 11.8281 14.8381L14.8381 11.8281C14.8581 11.8881 14.8581 11.9381 14.8581 11.9981Z"
      fill="currentColor"
    />
    <path
      d="M21.7689 2.22891C21.4689 1.92891 20.9789 1.92891 20.6789 2.22891L2.22891 20.6889C1.92891 20.9889 1.92891 21.4789 2.22891 21.7789C2.37891 21.9189 2.56891 21.9989 2.76891 21.9989C2.96891 21.9989 3.15891 21.9189 3.30891 21.7689L21.7689 3.30891C22.0789 3.00891 22.0789 2.52891 21.7689 2.22891Z"
      fill="currentColor"
    />
  </svg>
);

const EyeFilledIcon = (props) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path
      d="M21.25 9.14969C18.94 5.51969 15.56 3.42969 12 3.42969C10.22 3.42969 8.49 3.94969 6.91 4.91969C5.33 5.89969 3.91 7.32969 2.75 9.14969C1.75 10.7197 1.75 13.2697 2.75 14.8397C5.06 18.4797 8.44 20.5597 12 20.5597C13.78 20.5597 15.51 20.0397 17.09 19.0697C18.67 18.0897 20.09 16.6597 21.25 14.8397C22.25 13.2797 22.25 10.7197 21.25 9.14969ZM12 16.0397C9.76 16.0397 7.96 14.2297 7.96 11.9997C7.96 9.76969 9.76 7.95969 12 7.95969C14.24 7.95969 16.04 9.76969 16.04 11.9997C16.04 14.2297 14.24 16.0397 12 16.0397Z"
      fill="currentColor"
    />
    <path
      d="M11.9984 9.14062C10.4284 9.14062 9.14844 10.4206 9.14844 12.0006C9.14844 13.5706 10.4284 14.8506 11.9984 14.8506C13.5684 14.8506 14.8584 13.5706 14.8584 12.0006C14.8584 10.4306 13.5684 9.14062 11.9984 9.14062Z"
      fill="currentColor"
    />
  </svg>
);

const LOGIN_INTRO_DURATION_MS = 850;
const LOGIN_PANEL_WIDTH = "33.333333%";

function LoginPage({ onLogin }) {
  const [engineerId, setEngineerId] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const heroRef = useRef(null);
  const [isIntroGradient, setIsIntroGradient] = useState(true);

  const validateLogin = async () => {
    const trimmedId = engineerId.trim();
    setError("");

    if (trimmedId === "") {
      setError("Please enter a valid Engineer ID.");
      return;
    }

    try {
      const response = await fetch("/engineers.txt");
      const data = await response.text();
      const lines = data.split("\n");
      let found = false;

      for (const line of lines) {
        const [id, name, role] = line.split(",").map((item) => item.trim());

        if (id === trimmedId) {
          localStorage.setItem("username", name);
          localStorage.setItem("userRole", role);
          found = true;
          onLogin({ name, role });
          break;
        }
      }

      if (!found) {
        setError("Engineer ID not found.");
      }
    } catch {
      setError("Error fetching engineer data.");
    }
  };

  useEffect(() => {
    if (engineerId.trim().length === 14 || engineerId.trim().length === 16) {
      validateLogin();
    }
  }, [engineerId]);

  useEffect(() => {
    let rafId = 0;
    let nextMousePosition = { x: 50, y: 50 };

    const handleMouseMove = (e) => {
      nextMousePosition = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };

      if (rafId) return;

      rafId = window.requestAnimationFrame(() => {
        heroRef.current?.style.setProperty(
          "--mouse-x",
          `${nextMousePosition.x}%`,
        );
        heroRef.current?.style.setProperty(
          "--mouse-y",
          `${nextMousePosition.y}%`,
        );
        rafId = 0;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsIntroGradient(false);
    }, LOGIN_INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex sf-display">
      <style>{`
        .static-blue-gradient {
          background:
            radial-gradient(circle at 18% 22%, rgba(96, 165, 250, 0.92), transparent 30%),
            radial-gradient(circle at 82% 26%, rgba(59, 130, 246, 0.9), transparent 36%),
            radial-gradient(circle at 62% 78%, rgba(37, 99, 235, 0.86), transparent 32%),
            radial-gradient(circle at 20% 78%, rgba(23, 42, 159, 0.92), transparent 34%),
            linear-gradient(135deg, #3b82f6 0%, #2563eb 35%, #1f37c7 70%, #172a9f 100%);
          filter: blur(10px);
          transform: translateZ(0);
        }

        .mouse-blue-gradient {
          filter: blur(20px);
          mix-blend-mode: screen;
          transition: background 0.18s ease-out;
        }

        .sf-display {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
        }
      `}</style>
      <section
        className="absolute left-0 top-0 z-20 h-full overflow-hidden bg-white"
        style={{
          width: LOGIN_PANEL_WIDTH,
          opacity: isIntroGradient ? 0 : 1,
          transform: isIntroGradient ? "translateX(-100%)" : "translateX(0)",
          transition:
            "transform 820ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease 180ms",
          willChange: isIntroGradient ? "transform, opacity" : "auto",
        }}
      >
        <div className="flex h-full min-w-[320px] items-center justify-center px-8 py-10">
          <div className="w-full max-w-sm">
            <h2 className="mb-3 text-center text-3xl font-bold leading-tight text-black">
              Cisco ASS
            </h2>
            <p className="text-sm text-gray-600 mb-6 text-center">v1</p>

            <Form
              onSubmit={(e) => {
                e.preventDefault();
                validateLogin();
              }}
              className="w-full flex flex-col gap-4"
            >
              <Input
                value={engineerId}
                name="engineerId"
                onChange={(e) => setEngineerId(e.target.value)}
                placeholder="Enter your Engineer ID"
                type={isVisible ? "text" : "password"}
                variant="bordered"
                fullWidth
                endContent={
                  <button
                    aria-label="toggle password visibility"
                    className="focus:outline-none"
                    type="button"
                    onClick={() => setIsVisible((v) => !v)}
                    tabIndex={-1}
                  >
                    {isVisible ? (
                      <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    ) : (
                      <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                    )}
                  </button>
                }
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                color="primary"
                radius="full"
                className="w-full"
              >
                Sign In
              </Button>

              <p className="text-center text-sm text-gray-500">
                Need help?{" "}
                <Link href="#" size="sm">
                  Contact support
                </Link>
              </p>
            </Form>
          </div>
        </div>
      </section>

      <section
        ref={heroRef}
        className="absolute inset-0 flex h-full items-center justify-center overflow-hidden px-8 py-10 text-center text-white"
        style={{
          "--mouse-x": "50%",
          "--mouse-y": "50%",
        }}
      >
        <div className="absolute inset-0 bg-[#1f37c7]" />
        <div className="absolute inset-[-12%] static-blue-gradient" />
        <div
          className="pointer-events-none absolute inset-[-12%] mouse-blue-gradient"
          style={{
            background:
              "radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(139, 92, 246, 0.32), transparent 26%)",
          }}
        />

        <div
          className="relative z-10 flex max-w-4xl flex-col items-center"
          style={{
            transform: isIntroGradient
              ? "translateX(0)"
              : "translateX(16.666667vw)",
            transition: "transform 820ms cubic-bezier(0.16, 1, 0.3, 1)",
            willChange: isIntroGradient ? "transform" : "auto",
          }}
        >
          <img
            src={loginLogo}
            alt="Juniper IoT AP monitor logo"
            className="w-72 max-w-[68vw] object-contain"
          />
          <h1 className="mt-6 text-6xl font-bold leading-none md:text-7xl">
            Welcome Back
          </h1>
          <p className="mt-4 max-w-3xl text-1xl font-semibold leading-snug text-white/90 md:text-3xl">
            Monitor your assets and connected sensor telemetry
          </p>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    setUser(null);
  };

  if (user) {
    return <Dash user={user} onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={setUser} />;
}

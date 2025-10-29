import React from "react";
import "./login.css";

export default function Login() {
  return (
    <div className="login-container">
      <header className="login-header">
        <img
          src="/UMassImage.jpg"
          alt="ticket logo"
          className="login-logo"
        />
        <h1>Welcome back to UMassTickets</h1>
        <p>Log in to access the UMass marketplace</p>
      </header>

      <form className="login-form">
        <label>UMass Email</label>
        <input type="email" placeholder="yourname@umass.edu" />

        <label>Password</label>
        <input type="password" placeholder="Enter your password" />

        <button type="submit">Log In</button>

        <p className="signup-link">
          Don’t have an account? <a href="/signup">Sign up</a>
        </p>
      </form>
    </div>
  );
}

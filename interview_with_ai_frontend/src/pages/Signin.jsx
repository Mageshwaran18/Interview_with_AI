import { useState } from "react";
import { signinUser } from "../services/api";
import { useNavigate } from "react-router-dom";

function Signin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignin = async (e) => {
    e.preventDefault();

    try {
      const response = await signinUser({ email, password });

      // Store JWT in localStorage
      localStorage.setItem("token", response.data.access_token);

      alert("Login successful!");

      navigate("/dashboard");

    } catch (error) {
      alert(error.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div>
      <h2>Signin</h2>

      <form onSubmit={handleSignin}>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br /><br />

        <button type="submit">Signin</button>
      </form>

      <p onClick={() => navigate("/signup")}>
        Don't have account? Signup
      </p>
    </div>
  );
}

export default Signin;

/*
Flow:
User submits form →
Call backend /auth/signin →
Receive JWT →
Store in localStorage →
Redirect to dashboard
*/
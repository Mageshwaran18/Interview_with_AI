import { useState } from "react";
import { signupUser } from "../services/api";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const response = await signupUser({ email, password });
      alert(response.data.message);
      navigate("/"); // Go to login page after signup
    } catch (error) {
      alert(error.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div>
      <h2>Signup</h2>

      <form onSubmit={handleSignup}>
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

        <button type="submit">Signup</button>
      </form>

      <p onClick={() => navigate("/")}>
        Already have account? Signin
      </p>
    </div>
  );
}

export default Signup;

/*
Flow:
User fills form → handleSignup()
→ Calls backend /auth/signup
→ On success → redirect to signin
*/
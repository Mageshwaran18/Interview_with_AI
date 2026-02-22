import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await getCurrentUser(token);
        setEmail(response.data.email);
      } catch (error) {
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div>
      <h2>Dashboard</h2>

      <p>Logged in as: {email}</p>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;

/*
Dashboard Protection Logic:

1. Check if token exists
2. If not → redirect to login
3. If exists → call /auth/me
4. If valid → show user
5. If invalid → logout automatically
*/
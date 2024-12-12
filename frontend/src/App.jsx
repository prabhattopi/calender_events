import { useState, useEffect } from "react";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
import { backendUrl } from "./api/api";
import EventForm from "./components/Event/EventForm";
import EventTable from "./components/Event/EventTable";
import LoadingSpinner from "./components/Loading/LoadingSpinner";
import { FcGoogle } from "react-icons/fc"; // Import Google icon
const App = () => {
  const [events, setEvents] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setLoading(true);
      try {
        // Send codeResponse to backend to exchange for access token
        const userResponse = await axios.post(
          `${backendUrl}/users/google-login`,
          { code: codeResponse.code }
        );
        const { user, expiry_date } = userResponse.data;

        if (!user || !expiry_date) {
          throw new Error("Invalid response from backend");
        }

        // Save to localStorage
        localStorage.setItem(
          "user",
          JSON.stringify({
            userId: user,
            expiryDate: expiry_date, // Save expiry_date directly as milliseconds
          })
        );

        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error during login:", error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    },
    flow: "auth-code",
  });

  useEffect(() => {
    const checkTokenValidity = () => {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user || !user.expiryDate) {
        console.log("No valid token found. Logging out.");
        setIsLoggedIn(false);
        localStorage.removeItem("user");
        return;
      }

      const currentTime = Date.now(); // Current time in milliseconds
      const expiryTime = user.expiryDate; // expiry_date from backend in milliseconds

      if (expiryTime - currentTime <= 5 * 60 * 1000) {
        // Token expires in less than 5 minutes
        console.log("Token expired or expiring soon. Logging out.");
        setIsLoggedIn(false);
        localStorage.removeItem("user");
      } else {
        console.log("Token is valid.");
        setIsLoggedIn(true);
      }
    };

    // Initial check and set interval for every 3 minutes
    checkTokenValidity();
    const interval = setInterval(checkTokenValidity, 3 * 60 * 1000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);



  const fetchEvents = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await axios.post(`${backendUrl}/events/fetch-events`, {
        userId: user.userId,
      });
      console.log("User-created events:", response.data.events);
      setEvents(response.data.events);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isGet = true;

    if (isLoggedIn && isGet) {
      fetchEvents();
    }
    return () => {
      isGet = false;
    };
  }, [isLoggedIn]);

  const handleSaveEvent = async (event) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await axios.post(`${backendUrl}/events/create-event`, {
        ...event,
        userId: user.userId,
      });
      setEvents([response.data.event, ...events]);
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setLoading(false);
      setShowPopup(false);
    }
  };

  const handleOpenPopup = () => setShowPopup(true);
  const handleClosePopup = () => setShowPopup(false);

  return (
    <div className="App">
      {isLoggedIn ? (
        <>
          {loading && (
            <div className="container-login">
              <LoadingSpinner />
            </div>
          )}{" "}
          {/* Show spinner when loading */}
          {!loading && (
            <>
              <button className="btn" onClick={handleOpenPopup}>
                Create Event
              </button>
              <EventTable events={events} />
              {showPopup && (
                <EventForm
                  loading={loading}
                  onSubmit={handleSaveEvent}
                  onClose={handleClosePopup}
                />
              )}
            </>
          )}
        </>
      ) : (
        <div className="container-login">
          {loading ? (
            <LoadingSpinner /> // Show spinner during login
          ) : (
            <button className="google-login-button" onClick={() => login()}>
      <FcGoogle className="google-icon" />
      Sign in with Google
    </button>
          )}
        </div>
      )}
    </div>
  );
};

export default App;

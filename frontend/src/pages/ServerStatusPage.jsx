import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CustomAlert from "../components/CustomAlert";
import ConfirmDialog from "../components/ConfirmDialog";
import Footer from "../components/Footer";

const ServerStatusPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getAuthToken } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(0); // 0 seconds for testing
  const [showIP, setShowIP] = useState(false);
  const [serverData, setServerData] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isStopping, setIsStopping] = useState(false);
  const [userStoppedServer, setUserStoppedServer] = useState(false);
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);

  useEffect(() => {
    // Get server data from URL params
    const data = {
      instanceId: searchParams.get("instanceId"),
      publicIp: searchParams.get("publicIp"),
      serverAddress: searchParams.get("serverAddress"),
      serverName: searchParams.get("serverName"),
      minecraftVersion: searchParams.get("minecraftVersion"),
      serverType: searchParams.get("serverType"),
    };
    setServerData(data);
  }, [searchParams]);

  useEffect(() => {
    // Countdown timer
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowIP(true);
    }
  }, [timeRemaining]);

  // Poll EC2 instance status every 5 seconds
  useEffect(() => {
    if (!serverData?.instanceId) return;
    // Stop polling if inactivity alert has been shown
    if (showInactivityAlert) return;

    const checkServerStatus = async () => {
      try {
        const token = await getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

        const response = await fetch(
          `${apiUrl}/minecraft/info/${serverData.instanceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const wasActive = isActive;
          const isNowActive = data.state === "running";

          // Set active status based on EC2 instance state
          setIsActive(isNowActive);

          // If server was active but now stopped, and user didn't stop it, show inactivity alert
          if (wasActive && !isNowActive && !userStoppedServer) {
            setShowInactivityAlert(true);
          }
        }
      } catch (error) {
        console.error("Error checking server status:", error);
      }
    };

    // Check immediately
    checkServerStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkServerStatus, 5000);

    return () => clearInterval(interval);
  }, [
    serverData,
    getAuthToken,
    showInactivityAlert,
    isActive,
    userStoppedServer,
  ]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleStopServer = () => {
    setShowConfirm(true);
  };

  const handleConfirmStop = async () => {
    setShowConfirm(false);
    setIsStopping(true);

    try {
      const token = await getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const response = await fetch(
        `${apiUrl}/minecraft/stop/${serverData.instanceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to stop server");
      }

      // Show success alert
      setAlertMessage("Server has been stopped successfully!");
      setShowAlert(true);
      setIsActive(false);
      setUserStoppedServer(true);
    } catch (error) {
      console.error("Error stopping server:", error);
      alert(`Failed to stop server: ${error.message}`);
    } finally {
      setIsStopping(false);
    }
  };

  const handleCancelStop = () => {
    setShowConfirm(false);
  };

  const handleAlertClose = () => {
    setShowAlert(false);
    // Redirect to dashboard
    const basePath =
      import.meta.env.VITE_GITHUB_PAGES === "true"
        ? "/The_Minecraft_Server_Generator"
        : "";
    navigate(`${basePath}/dashboard`);
  };

  const handleInactivityAlertClose = () => {
    setShowInactivityAlert(false);
  };

  const handleBackToDashboard = () => {
    const basePath =
      import.meta.env.VITE_GITHUB_PAGES === "true"
        ? "/The_Minecraft_Server_Generator"
        : "";
    navigate(`${basePath}/dashboard`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#012500" }}>
      {/* Header */}
      <header className="bg-minecraft-headerBrown shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-white">
            Minecraft Server Status
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {!showIP ? (
            // Loading State
            <div className="card text-center">
              <div className="mb-8">
                <svg
                  className="animate-spin h-20 w-20 mx-auto text-minecraft-green mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Creating Your Minecraft Server
                </h2>
                <p className="text-gray-600 mb-6">
                  Please wait while we set up your server...
                </p>
              </div>

              {/* Timer */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-600 mb-2">Time Remaining</p>
                <p className="text-5xl font-bold text-minecraft-green">
                  {formatTime(timeRemaining)}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="text-left space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-700">EC2 instance launching</span>
                </div>
                <div
                  className={`flex items-center space-x-3 ${timeRemaining < 150 ? "" : "opacity-50"}`}
                >
                  <div className="flex-shrink-0">
                    {timeRemaining < 150 ? (
                      <svg
                        className="w-6 h-6 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-gray-700">Installing Docker</span>
                </div>
                <div
                  className={`flex items-center space-x-3 ${timeRemaining < 60 ? "" : "opacity-50"}`}
                >
                  <div className="flex-shrink-0">
                    {timeRemaining < 60 ? (
                      <svg
                        className="w-6 h-6 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-gray-700">
                    Starting Minecraft server
                  </span>
                </div>
                <div
                  className={`flex items-center space-x-3 ${timeRemaining === 0 ? "" : "opacity-50"}`}
                >
                  <div className="flex-shrink-0">
                    {timeRemaining === 0 ? (
                      <svg
                        className="w-6 h-6 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-gray-700">Server ready!</span>
                </div>
              </div>
            </div>
          ) : (
            // Server Info Display
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  {isActive
                    ? "Server Ready!"
                    : "(Server Currently Turned Off!)"}
                </h2>
                <div
                  className={`px-4 py-2 rounded-full ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <span className="font-semibold">
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Server Details */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Server Name</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {serverData?.serverName || "N/A"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Server Address</p>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xl font-mono font-bold text-minecraft-green ${!isActive ? "blur-sm select-none" : ""}`}
                    >
                      {serverData?.serverAddress || "N/A"}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(serverData?.serverAddress || "")
                      }
                      disabled={!isActive}
                      className={`btn-secondary text-sm ${!isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Minecraft Version
                    </p>
                    <p
                      className={`text-lg font-semibold text-gray-900 ${!isActive ? "blur-sm select-none" : ""}`}
                    >
                      {serverData?.minecraftVersion || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Server Type</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {serverData?.serverType || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connection Instructions */}
              <div
                className={`mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg ${!isActive ? "blur-sm select-none" : ""}`}
              >
                <h3 className="font-semibold text-blue-900 mb-2">
                  How to Connect:
                </h3>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>Open Minecraft Java Edition</li>
                  <li>Go to Multiplayer → Add Server</li>
                  <li>
                    Server Address: <strong>{serverData?.publicIp}</strong>
                  </li>
                  <li>Click Done → Join Server</li>
                </ol>
              </div>

              {/* Stop Server Button or Go Back Button */}
              <div className="mt-6 flex justify-center">
                {isActive ? (
                  <button
                    onClick={handleStopServer}
                    disabled={isStopping}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      isStopping
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-minecraft-green hover:bg-green-600 text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {isStopping ? "Stopping..." : "Stop Server"}
                  </button>
                ) : (
                  <button
                    onClick={handleBackToDashboard}
                    className="px-6 py-3 rounded-lg font-semibold bg-minecraft-green hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Go Back to Dashboard
                  </button>
                )}
              </div>

              {/* Success Alert */}
              {showAlert && (
                <CustomAlert
                  message={alertMessage}
                  onClose={handleAlertClose}
                />
              )}

              {/* Inactivity Alert */}
              {showInactivityAlert && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-yellow-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Server Stopped
                        </h3>
                        <p className="text-gray-600">
                          The server has been stopped due to inactivity. You can
                          close this tab or click "Got it!" to continue.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleInactivityAlertClose}
                        className="btn-primary bg-minecraft-green hover:bg-green-600"
                      >
                        Got it!
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Dialog */}
              {showConfirm && (
                <ConfirmDialog
                  message="Are you sure you want to stop this server?"
                  onConfirm={handleConfirmStop}
                  onCancel={handleCancelStop}
                />
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServerStatusPage;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabaseClient";
import Footer from "../components/Footer";
import CreateServerForm from "../components/CreateServerForm";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, getAuthToken, refreshProfile } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [minecraftVersions, setMinecraftVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [showOutOfAttemptsAlert, setShowOutOfAttemptsAlert] = useState(false);
  const [outOfAttemptsType, setOutOfAttemptsType] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    serverName: "",
    minecraftType: "VANILLA",
    version: "LATEST",
    gamemode: "survival",
    difficulty: "normal",
    seed: "",
    welcomeChest: false,
    allowCrackedPlayers: false,
  });

  // Fetch Minecraft versions from backend
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch("http://localhost:8080/versions");
        if (response.ok) {
          const data = await response.json();
          setMinecraftVersions(data.versions || []);
        } else {
          console.error("Failed to fetch versions");
        }
      } catch (error) {
        console.error("Error fetching versions:", error);
      } finally {
        setVersionsLoading(false);
      }
    };

    fetchVersions();
  }, []);

  const handleLogout = async () => {
    navigate("/");
    await signOut();
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const isFormValid = () => {
    return (
      formData.serverName.trim() !== "" &&
      formData.minecraftType !== "" &&
      formData.version !== "" &&
      formData.gamemode !== "" &&
      formData.difficulty !== ""
    );
  };

  const handleCreateCustomServer = async () => {
    if (!isFormValid()) return;

    if ((profile?.custom_server_trial_attempts ?? 0) <= 0) {
      setOutOfAttemptsType("custom");
      setShowOutOfAttemptsAlert(true);
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      // Debug logging
      console.log(
        "DEBUG Frontend: allowCrackedPlayers =",
        formData.allowCrackedPlayers,
      );
      console.log(
        "DEBUG Frontend: online_mode will be sent as =",
        !formData.allowCrackedPlayers,
      );

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      // Decrement custom server trial attempts
      const { error: decrementError } = await supabase
        .from("profiles")
        .update({
          custom_server_trial_attempts:
            (profile?.custom_server_trial_attempts ?? 1) - 1,
        })
        .eq("id", user?.id);

      if (decrementError) {
        console.error(
          "Failed to decrement custom_server_trial_attempts:",
          decrementError,
        );
        throw new Error("Could not update trial attempts. Please try again.");
      }
      await refreshProfile();

      const response = await fetch(`${apiUrl}/minecraft/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_email: user?.email,
          eula: true,
          server_name: formData.serverName,
          minecraft_type: formData.minecraftType,
          version: formData.version,
          gamemode: formData.gamemode,
          difficulty: formData.difficulty,
          level_seed: formData.seed || undefined,
          welcome_chest: formData.welcomeChest,
          online_mode: !formData.allowCrackedPlayers,
          motd: `${formData.serverName} - Welcome!`,
          max_players: 10,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create server");
      }

      const data = await response.json();
      console.log("Server created:", data);

      // Redirect to server status page
      const params = new URLSearchParams({
        instanceId: data.instance_id,
        publicIp: data.public_ip,
        serverAddress: data.server_address,
        serverName: data.server_name,
        minecraftVersion: data.minecraft_version,
        serverType: data.server_type,
      });

      navigate(`/server-status?${params.toString()}`);

      // Reset form
      setFormData({
        serverName: "",
        minecraftType: "VANILLA",
        version: "LATEST",
        gamemode: "survival",
        difficulty: "normal",
        seed: "",
        welcomeChest: false,
        allowCrackedPlayers: false,
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error("Error creating server:", err);
      setError(err.message || "Failed to create server. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunScript = async () => {
    if ((profile?.test_service_trial_attempts ?? 0) <= 0) {
      setOutOfAttemptsType("test");
      setShowOutOfAttemptsAlert(true);
      return;
    }

    setIsRunning(true);
    setError("");

    try {
      // Get authentication token
      const token = await getAuthToken();

      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      // Decrement test service trial attempts
      const { error: decrementError } = await supabase
        .from("profiles")
        .update({
          test_service_trial_attempts:
            (profile?.test_service_trial_attempts ?? 1) - 1,
        })
        .eq("id", user?.id);

      if (decrementError) {
        console.error(
          "Failed to decrement test_service_trial_attempts:",
          decrementError,
        );
        throw new Error("Could not update trial attempts. Please try again.");
      }
      await refreshProfile();

      // Call the backend API with authentication
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(`${apiUrl}/minecraft/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_email: user?.email, // Add user email for server naming
          eula: true,
          server_name: `minecraft-${Date.now()}`,
          minecraft_type: "VANILLA",
          version: "LATEST",
          max_players: 10,
          gamemode: "survival",
          difficulty: "normal",
          motd: "Server created from dashboard!",
          memory: "3G",
          online_mode: false,
          instance_type: "t3.medium",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create server");
      }

      const data = await response.json();
      console.log("Server created:", data);

      // Redirect to server status page
      const params = new URLSearchParams({
        instanceId: data.instance_id,
        publicIp: data.public_ip,
        serverAddress: data.server_address,
        serverName: data.server_name,
        minecraftVersion: data.minecraft_version,
        serverType: data.server_type,
      });

      navigate(`/server-status?${params.toString()}`);
    } catch (err) {
      console.error("Error creating server:", err);
      setError(err.message || "Failed to create server. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  const testAttemptsLeft = profile?.test_service_trial_attempts ?? 0;
  const customAttemptsLeft = profile?.custom_server_trial_attempts ?? 0;

  const attemptBadgeClass = (n) =>
    n === 0
      ? "text-red-500"
      : n === 1
        ? "text-amber-500"
        : "text-minecraft-grass";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#012500" }}>
      {/* Out of attempts alert */}
      {showOutOfAttemptsAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-500"
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
                  Free Trial Exhausted
                </h3>
                <p className="text-gray-600">
                  You have used all your free trial attempts for the{" "}
                  <span className="font-semibold">
                    {outOfAttemptsType === "test"
                      ? "Test Service"
                      : "Custom Server"}
                  </span>{" "}
                  feature. Please contact support to upgrade your account.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowOutOfAttemptsAlert(false)}
                className="btn-primary"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dashboard Header */}
      <header className="bg-minecraft-headerBrown shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Server Dashboard</h1>
            <button onClick={handleLogout} className="btn-secondary">
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <div className="card mb-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1">
                  Welcome back!
                </h2>
                <p
                  className="text-base sm:text-xl font-semibold break-all mb-2"
                  style={{ color: "#22c55e" }}
                >
                  {user?.email}
                </p>
                <p className="text-gray-600 text-sm sm:text-base">
                  Manage your Minecraft servers from here
                </p>
              </div>
              <div className="hidden md:block flex-shrink-0">
                <img
                  src="https://mc-heads.net/avatar/steve/100"
                  alt="Minecraft Avatar"
                  className="w-24 h-24"
                />
              </div>
            </div>
          </div>

          {/* Server Status Card */}
          {/* Stats cards (Active Servers / Total Players / Uptime) — commented out until real data is available
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center">
              <div className="text-minecraft-green mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
              <p className="text-gray-600 text-sm">Active Servers</p>
            </div>

            <div className="card text-center">
              <div className="text-minecraft-brown mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">0</h3>
              <p className="text-gray-600 text-sm">Total Players</p>
            </div>

            <div className="card text-center">
              <div className="text-minecraft-grass mb-2">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">0h</h3>
              <p className="text-gray-600 text-sm">Uptime</p>
            </div>
          </div>
          */}

          {/* Action Card */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Server Management
            </h3>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Test Our Service
                  </h4>
                  <p className="text-sm text-gray-600">
                    Run a default Minecraft Server to test our service.
                  </p>
                  <p
                    className={`text-xs mt-1 font-semibold ${attemptBadgeClass(testAttemptsLeft)}`}
                  >
                    Free Trial —{" "}
                    {testAttemptsLeft === 0
                      ? "No attempts remaining"
                      : `${testAttemptsLeft} attempt${
                          testAttemptsLeft !== 1 ? "s" : ""
                        } remaining`}
                  </p>
                </div>
                <button
                  onClick={handleRunScript}
                  disabled={isRunning || testAttemptsLeft === 0}
                  className="btn-primary flex items-center space-x-2 flex-shrink-0"
                >
                  {isRunning ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
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
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Run Server</span>
                    </>
                  )}
                </button>
              </div>

              {/* Create New Server Section */}
              <div>
                <div
                  className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    if (customAttemptsLeft <= 0) {
                      setOutOfAttemptsType("custom");
                      setShowOutOfAttemptsAlert(true);
                    } else {
                      setShowCreateForm(!showCreateForm);
                    }
                  }}
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Create New Server
                    </h4>
                    <p className="text-sm text-gray-600">
                      Deploy a custom Minecraft server instance
                    </p>
                    <p
                      className={`text-xs mt-1 font-semibold ${attemptBadgeClass(customAttemptsLeft)}`}
                    >
                      Free Trial —{" "}
                      {customAttemptsLeft === 0
                        ? "No attempts remaining"
                        : `${customAttemptsLeft} attempt${
                            customAttemptsLeft !== 1 ? "s" : ""
                          } remaining`}
                    </p>
                  </div>
                  <button className="btn-secondary flex items-center space-x-2 flex-shrink-0">
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
                        showCreateForm ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <span>{showCreateForm ? "Hide" : "Show"}</span>
                  </button>
                </div>

                {/* Create Server Form */}
                {showCreateForm && (
                  <CreateServerForm
                    formData={formData}
                    onChange={handleFormChange}
                    onSubmit={handleCreateCustomServer}
                    isCreating={isCreating}
                    isValid={isFormValid()}
                    error={error}
                    minecraftVersions={minecraftVersions}
                    versionsLoading={versionsLoading}
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed">
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Server Configuration
                  </h4>
                  <p className="text-sm text-gray-600">
                    Customize your server settings
                  </p>
                </div>
                <button
                  disabled
                  className="btn-secondary opacity-50 cursor-not-allowed flex-shrink-0"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;

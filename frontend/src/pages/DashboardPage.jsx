import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";
import CreateServerForm from "../components/CreateServerForm";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, signOut, getAuthToken } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [minecraftVersions, setMinecraftVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(true);

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

    setIsCreating(true);
    setError("");

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
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
          max_players: 20,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create server");
      }

      const data = await response.json();
      console.log("Server created:", data);

      // Open new tab with server status page
      const params = new URLSearchParams({
        instanceId: data.instance_id,
        publicIp: data.public_ip,
        serverAddress: data.server_address,
        serverName: data.server_name,
        minecraftVersion: data.minecraft_version,
        serverType: data.server_type,
      });

      const basePath =
        import.meta.env.VITE_GITHUB_PAGES === "true"
          ? "/The_Minecraft_Server_Generator"
          : "";
      window.open(`${basePath}/server-status?${params.toString()}`, "_blank");

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
    setIsRunning(true);
    setError("");

    try {
      // Get authentication token
      const token = await getAuthToken();

      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

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
          max_players: 20,
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

      // Open new tab with server status page
      const params = new URLSearchParams({
        instanceId: data.instance_id,
        publicIp: data.public_ip,
        serverAddress: data.server_address,
        serverName: data.server_name,
        minecraftVersion: data.minecraft_version,
        serverType: data.server_type,
      });

      const basePath =
        import.meta.env.VITE_GITHUB_PAGES === "true"
          ? "/The_Minecraft_Server_Generator"
          : "";
      window.open(`${basePath}/server-status?${params.toString()}`, "_blank");
    } catch (err) {
      console.error("Error creating server:", err);
      setError(err.message || "Failed to create server. Please try again.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#012500" }}>
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back to your dashboard{" "}
                  <span style={{ color: "#22c55e" }}>{user?.email}</span>!
                </h2>
                <p className="text-gray-600">
                  Manage your Minecraft servers from here
                </p>
              </div>
              <div className="hidden md:block">
                <img
                  src="https://mc-heads.net/avatar/steve/100"
                  alt="Minecraft Avatar"
                  className="w-24 h-24"
                />
              </div>
            </div>
          </div>

          {/* Server Status Card */}
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

          {/* Action Card */}
          <div className="card">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Server Management
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Test Our Service
                  </h4>
                  <p className="text-sm text-gray-600">
                    Run a default Minecraft Server to test our service.
                  </p>
                </div>
                <button
                  onClick={handleRunScript}
                  disabled={isRunning}
                  className="btn-primary flex items-center space-x-2"
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
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Create New Server
                    </h4>
                    <p className="text-sm text-gray-600">
                      Deploy a custom Minecraft server instance
                    </p>
                  </div>
                  <button className="btn-secondary flex items-center space-x-2">
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

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50 cursor-not-allowed">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Server Configuration
                  </h4>
                  <p className="text-sm text-gray-600">
                    Customize your server settings
                  </p>
                </div>
                <button
                  disabled
                  className="btn-secondary opacity-50 cursor-not-allowed"
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

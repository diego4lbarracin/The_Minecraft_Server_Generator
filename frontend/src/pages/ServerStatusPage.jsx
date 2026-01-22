import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";

const ServerStatusPage = () => {
  const [searchParams] = useSearchParams();
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes in seconds
  const [showIP, setShowIP] = useState(false);
  const [serverData, setServerData] = useState(null);
  const [isActive, setIsActive] = useState(false);

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
      setIsActive(true); // Assume server is active after 3 minutes
    }
  }, [timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#012500" }}>
      {/* Header */}
      <header className="bg-minecraft-headerBrown shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-white">
            Minecraft Server Creation
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
                  Server Ready!
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
                    <p className="text-xl font-mono font-bold text-minecraft-green">
                      {serverData?.serverAddress || "N/A"}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(serverData?.serverAddress || "")
                      }
                      className="btn-secondary text-sm"
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
                    <p className="text-lg font-semibold text-gray-900">
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
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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

              {/* Warning */}
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Cost Warning:</strong> This server costs
                  ~$0.02/hour ($0.50/day if running 24/7). Remember to stop or
                  terminate it when not in use!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServerStatusPage;

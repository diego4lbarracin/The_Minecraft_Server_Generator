import minecraftSkin from "/image_skin.png";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Hero Section */}
      <main className="flex-1 container mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Minecraft Skin Image */}
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-minecraft-green opacity-20 blur-3xl rounded-full"></div>
              <img
                src={minecraftSkin}
                alt="Minecraft Character"
                className="relative w-64 h-64 md:w-96 md:h-96 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Hero Text */}
          <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Create Your Own
              <span className="block text-minecraft-grass">
                Minecraft Server
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
              Launch your own Minecraft Java Edition server in minutes. No
              technical knowledge required. Completely free and easy to use.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <div className="flex items-center space-x-3">
                <svg
                  className="w-6 h-6 text-minecraft-grass flex-shrink-0"
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
                <span className="text-gray-200">Easy Setup</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg
                  className="w-6 h-6 text-minecraft-grass flex-shrink-0"
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
                <span className="text-gray-200">Java Edition</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg
                  className="w-6 h-6 text-minecraft-grass flex-shrink-0"
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
                <span className="text-gray-200">24/7 Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="text-minecraft-green mb-4 flex justify-center">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Very Fast</h3>
            <p className="text-gray-600">
              Deploy your own dedicated Minecraft server in just 2 minutes!
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="text-minecraft-green mb-4 flex justify-center">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Secure & Reliable
            </h3>
            <p className="text-gray-600">
              Your servers run on protected infrastructure and are ready to be
              used 24/7!
            </p>
          </div>

          <div className="card text-center hover:shadow-xl transition-shadow">
            <div className="text-minecraft-green mb-4 flex justify-center">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Fully Customizable
            </h3>
            <p className="text-gray-600">
              Customize every aspect of your server, select the seed, game mode,
              Minecraft version and many more options!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;

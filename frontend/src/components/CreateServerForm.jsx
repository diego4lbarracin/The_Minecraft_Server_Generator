const CreateServerForm = ({
  formData,
  onChange,
  onSubmit,
  isCreating,
  isValid,
  error,
  minecraftVersions = [],
  versionsLoading = false,
}) => {
  return (
    <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Server Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Minecraft Server Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="serverName"
          value={formData.serverName}
          onChange={onChange}
          placeholder="My Awesome Server"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minecraft-green focus:border-transparent text-gray-800 placeholder-gray-500"
          required
        />
      </div>

      {/* Server Type and Gamemode */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Server Type <span className="text-red-500">*</span>
          </label>
          <select
            name="minecraftType"
            value={formData.minecraftType}
            onChange={onChange}
            className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minecraft-green focus:border-transparent text-gray-800 appearance-none bg-white bg-no-repeat bg-[length:1.5em] bg-[right_0.5rem_center]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            }}
            required
          >
            <option value="VANILLA">Vanilla</option>
            <option value="SPIGOT">Spigot</option>
            <option value="PAPER">Paper</option>
            <option value="FORGE">Forge</option>
            <option value="FABRIC">Fabric</option>
            <option value="PURPUR">Purpur</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gamemode <span className="text-red-500">*</span>
          </label>
          <select
            name="gamemode"
            value={formData.gamemode}
            onChange={onChange}
            className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minecraft-green focus:border-transparent text-gray-800 appearance-none bg-white bg-no-repeat bg-[length:1.5em] bg-[right_0.5rem_center]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            }}
            required
          >
            <option value="survival">Survival</option>
            <option value="creative">Creative</option>
            <option value="adventure">Adventure</option>
            <option value="spectator">Spectator</option>
            <option value="hardcore">Hardcore</option>
          </select>
        </div>
      </div>

      {/* Minecraft Version and Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Minecraft Version <span className="text-red-500">*</span>
          </label>
          <select
            name="version"
            value={formData.version}
            onChange={onChange}
            className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minecraft-green focus:border-transparent text-gray-800 appearance-none bg-white bg-no-repeat bg-[length:1.5em] bg-[right_0.5rem_center]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            }}
            required
            disabled={versionsLoading}
          >
            <option value="LATEST">Latest</option>
            {versionsLoading ? (
              <option disabled>Loading versions...</option>
            ) : minecraftVersions.length > 0 ? (
              minecraftVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.id}
                </option>
              ))
            ) : (
              <>
                {/* Fallback to hardcoded versions if API fails */}
                {/* 1.21.x versions */}
                <option value="1.21.11">1.21.11</option>
                <option value="1.21.10">1.21.10</option>
                <option value="1.21.9">1.21.9</option>
                <option value="1.21.8">1.21.8</option>
                <option value="1.21.7">1.21.7</option>
                <option value="1.21.6">1.21.6</option>
                <option value="1.21.5">1.21.5</option>
                <option value="1.21.4">1.21.4</option>
                <option value="1.21.3">1.21.3</option>
                <option value="1.21.2">1.21.2</option>
                <option value="1.21.1">1.21.1</option>
                <option value="1.21">1.21</option>
                {/* 1.20.x versions */}
                <option value="1.20.6">1.20.6</option>
                <option value="1.20.5">1.20.5</option>
                <option value="1.20.4">1.20.4</option>
                <option value="1.20.3">1.20.3</option>
                <option value="1.20.2">1.20.2</option>
                <option value="1.20.1">1.20.1</option>
                <option value="1.20">1.20</option>
                {/* 1.19.x versions */}
                <option value="1.19.4">1.19.4</option>
                <option value="1.19.3">1.19.3</option>
                <option value="1.19.2">1.19.2</option>
                <option value="1.19.1">1.19.1</option>
                <option value="1.19">1.19</option>
                {/* 1.18.x versions */}
                <option value="1.18.2">1.18.2</option>
                <option value="1.18.1">1.18.1</option>
                <option value="1.18">1.18</option>
                {/* 1.17.x versions */}
                <option value="1.17.1">1.17.1</option>
                <option value="1.17">1.17</option>
                {/* 1.16.x versions */}
                <option value="1.16.5">1.16.5</option>
                <option value="1.16.4">1.16.4</option>
                <option value="1.16.3">1.16.3</option>
                <option value="1.16.2">1.16.2</option>
                <option value="1.16.1">1.16.1</option>
                <option value="1.16">1.16</option>
                {/* 1.15.x versions */}
                <option value="1.15.2">1.15.2</option>
                <option value="1.15.1">1.15.1</option>
                <option value="1.15">1.15</option>
                {/* 1.14.x versions */}
                <option value="1.14.4">1.14.4</option>
                <option value="1.14.3">1.14.3</option>
                <option value="1.14.2">1.14.2</option>
                <option value="1.14.1">1.14.1</option>
                <option value="1.14">1.14</option>
                {/* 1.13.x versions */}
                <option value="1.13.2">1.13.2</option>
                <option value="1.13.1">1.13.1</option>
                <option value="1.13">1.13</option>
                {/* 1.12.x versions */}
                <option value="1.12.2">1.12.2</option>
                <option value="1.12.1">1.12.1</option>
                <option value="1.12">1.12</option>
                {/* 1.11.x versions */}
                <option value="1.11.2">1.11.2</option>
                <option value="1.11.1">1.11.1</option>
                <option value="1.11">1.11</option>
                {/* 1.10.x versions */}
                <option value="1.10.2">1.10.2</option>
                <option value="1.10.1">1.10.1</option>
                <option value="1.10">1.10</option>
                {/* 1.9.x versions */}
                <option value="1.9.4">1.9.4</option>
                <option value="1.9.3">1.9.3</option>
                <option value="1.9.2">1.9.2</option>
                <option value="1.9.1">1.9.1</option>
                <option value="1.9">1.9</option>
                {/* 1.8.x versions */}
                <option value="1.8.9">1.8.9</option>
                <option value="1.8.8">1.8.8</option>
                <option value="1.8">1.8</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Difficulty <span className="text-red-500">*</span>
          </label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={onChange}
            className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minecraft-green focus:border-transparent text-gray-800 appearance-none bg-white bg-no-repeat bg-[length:1.5em] bg-[right_0.5rem_center]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            }}
            required
          >
            <option value="peaceful">Peaceful</option>
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Seed */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          World Seed (Optional)
        </label>
        <input
          type="text"
          name="seed"
          value={formData.seed}
          onChange={onChange}
          placeholder="Leave empty for random seed"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-minecraft-green focus:border-transparent text-gray-800 placeholder-gray-500"
        />
      </div>

      {/* Welcome Chest - Temporarily hidden */}
      {false && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-50">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-700">
              Welcome Chest
              <span className="ml-2 text-xs text-red-600 font-normal">
                (Not Supported)
              </span>
            </label>
            <div className="group relative">
              <svg
                className="w-4 h-4 text-gray-400 cursor-help"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-64 pointer-events-none z-10">
                This feature is not supported by docker-minecraft-server. Would
                require a custom plugin/datapack to implement starter items for
                new players.
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-not-allowed">
            <input
              type="checkbox"
              name="welcomeChest"
              checked={formData.welcomeChest}
              onChange={onChange}
              disabled
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-minecraft-green"></div>
          </label>
        </div>
      )}

      {/* Allow Cracked Players */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-semibold text-gray-700">
            Allow Cracked Players
          </label>
          <div className="group relative">
            <svg
              className="w-4 h-4 text-gray-400 cursor-help"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none z-10">
              Allows players with unofficial versions of Minecraft to join the
              server
            </div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="allowCrackedPlayers"
            checked={formData.allowCrackedPlayers}
            onChange={onChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-minecraft-green"></div>
        </label>
      </div>

      {/* Start Server Button */}
      <div className="pt-4">
        <button
          onClick={onSubmit}
          disabled={!isValid || isCreating}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
            !isValid || isCreating
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-minecraft-green hover:bg-green-600 text-white shadow-lg hover:shadow-xl"
          }`}
        >
          {isCreating ? (
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
              <span>Creating Server...</span>
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
              <span>Start Server</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateServerForm;

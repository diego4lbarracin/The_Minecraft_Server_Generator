import { useState, useEffect } from "react";

const CustomAlert = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-bounce-in">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-minecraft-green"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Success!
            </h3>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;

/**
 * ErrorAlert — displays an error message box.
 */
export default function ErrorAlert({ message, onRetry }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
      <svg
        className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 001.5 0v-4.5a.75.75 0 00-1.5 0v4.5zm.75 2.5a1 1 0 110-2 1 1 0 010 2z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-800">Error</p>
        <p className="text-sm text-red-700 mt-0.5 break-words">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-secondary text-xs border-red-300 text-red-700 hover:bg-red-100"
        >
          Retry
        </button>
      )}
    </div>
  );
}

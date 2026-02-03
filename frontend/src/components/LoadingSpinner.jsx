/**
 * Loading Spinner Component
 * Displays while content is loading
 */

function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-scripture-cream flex flex-col items-center justify-center p-4">
      {/* Spinner */}
      <div 
        className="w-16 h-16 border-4 border-scripture-gold border-t-scripture-navy rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
      
      {/* Message */}
      <p className="mt-6 text-xl text-gray-600">
        {message}
      </p>
      
      {/* Screen reader text */}
      <span className="sr-only">{message}</span>
    </div>
  );
}

export default LoadingSpinner;

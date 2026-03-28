import StarBackground from "./starBackground";

type LoadingScreenProps = {
  message?: string;
};

export default function LoadingScreen({
  message = "Preparing your story workspace...",
}: LoadingScreenProps) {
  return (
    <>
      <StarBackground />
      <div className="loading-screen" role="status" aria-live="polite"> 
        <div className="loading-card">
          <img
            src="/textures/logo/logo1.png"
            alt="Story Dreamer logo"
            className="loading-logo"
          />
          <p className="loading-message">{message}</p>
          <div className="loading-bar" aria-hidden="true">
            <span className="loading-bar-fill" />
          </div>
        </div>
      </div>
    </>
  );
}
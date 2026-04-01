import StarBackground from "./starBackground";

export default function GalaxyBackground() {
  return (
    <>
      <StarBackground/>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        
        {/* 🌌 Nebula glow */}
        <div className="absolute inset-0 opacity-40
          bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.15),transparent_40%),
              radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.15),transparent_40%),
              radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_60%)]" 
        />s

        {/* 🌠 Meteors */}
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className="meteor"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 60}s`,
            }}
          />
        ))}

        {/* 🌠 BIG Meteors */}
        {[...Array(2)].map((_, i) => (
          <span
            key={i}
            className="bigmeteor-diagonal"
            style={{
              top: `${Math.random() * 100}%`,
              right: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 180}s`,
            }}
          />
        ))}

        {/* 🪐 Planets */}
        <div className="orbit-axis orbit-1">
          <div className="planet planet-1"></div>
        </div>

        {/* Planet 2 Orbit */}
        <div className="orbit-axis orbit-2">
          <div className="planet planet-2"></div>
        </div>

      </div>
    </>
  );
}
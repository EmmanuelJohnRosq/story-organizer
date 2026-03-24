import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import GalaxyBackground from "./backgroundEffect";
import { useEffect, useState } from "react";

export default function Layout() {
  const location = useLocation();

  const [showGalaxy, setShowGalaxy] = useState(false);

  // Load user preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('galaxy-bg');
    if (saved !== null) setShowGalaxy(JSON.parse(saved));
  }, []);

  const handleToggle = () => {
    const nextValue = !showGalaxy;
    setShowGalaxy(nextValue);
    localStorage.setItem('galaxy-bg', JSON.stringify(nextValue));
  };
  
  return (
    <>
        <Header showGalaxy={showGalaxy} onToggle={handleToggle} />

        {showGalaxy && <GalaxyBackground />}

        {/* MAIN APP CONTAINER / GLOBAL BACKGROUND */}
        <div
            className={`relative min-h-screen w-full min-w-0 mx-auto transition-colors duration-300
             bg-white ${showGalaxy ? "dark:bg-gray-800/0" : "dark:bg-gray-800"} text-black dark:text-white`}
        >

            {/* All pages will render here */}
            <main>
              <Outlet key={location.pathname} /> 
          </main>
        </div>
    </>
  );
}

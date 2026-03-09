import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <>
        <Header/>

        {/* MAIN APP CONTAINER / GLOBAL BACKGROUND */}
        <div
            className={`relative min-h-screen w-full min-w-0 mx-auto px-1 transition-colors duration-300
            bg-white text-black dark:bg-gray-800 dark:text-white`}
        >
            {/* All pages will render here */}
            <Outlet />
        </div>
    </>
  );
}

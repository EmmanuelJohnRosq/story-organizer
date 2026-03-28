import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";

import UserPage from "./pages/UserPage";
import ExperimentPage from "./pages/ExperimentPage";
import { useEffect, useState } from "react";

import { useGoogleAuth} from "./context/GoogleAuthContext";
import CharEditPage from "./pages/CharEditPage";
import CharacterPageCopy from "./pages/CharacterPageCopy";
import LoadingScreen from "./components/LoadingScreen";

export default function StoryOrganizer() {
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  const { initialize } = useGoogleAuth();

  // INITIALIZE CLIENT ID FOR GOOGLE AUTH CONNECTION
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("Google Client ID is missing");
      return;
    }

    initialize(clientId);
  }, [initialize]);

  useEffect(() => {
    const loadingDelay = window.setTimeout(() => {
      setShowLoadingScreen(false);
    }, 1000);

    return () => window.clearTimeout(loadingDelay);
  }, []);

const { pathname } = useLocation();

useEffect(() => {
  window.scrollTo(0, 0);
}, [pathname]);

if (showLoadingScreen) {
  return <LoadingScreen />;
}

  // ROUTING CODE
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route 
          index
          path="/" 
          element={<UserPage />} 
        />
        <Route 
          path="book/:currentBookId/" 
          element={<ExperimentPage />} 
        />
        <Route
          path="book/:currentBookId/:characterSlug"
          element={<CharEditPage />}
        />
        <Route
          path="book/:currentBookId/:characterSlug/copy"
          element={<CharacterPageCopy />}
        />
      </Route>
    </Routes>
  );
}


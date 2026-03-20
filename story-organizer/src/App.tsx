import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";

import UserPage from "./pages/UserPage";
import BookPage from "./pages/BookPage";
import ExperimentPage from "./pages/ExperimentPage";
import CharacterPage from "./pages/CharacterPage";
import { useEffect } from "react";

import { useGoogleAuth} from "./context/GoogleAuthContext";
import CharEditPage from "./pages/CharEditPage";
import CharacterPageCopy from "./pages/CharacterPageCopy";

export default function StoryOrganizer() {

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

const { pathname } = useLocation();

useEffect(() => {
  window.scrollTo(0, 0);
}, [pathname]);

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
          element={<CharacterPageCopy />}
        />
        <Route
          path="book/:currentBookId/:characterSlug/edit"
          element={<CharEditPage />}
        />
      </Route>
    </Routes>
  );
}


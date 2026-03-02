import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import UserPage from "./pages/UserPage";
import BookPage from "./pages/BookPage";
import CharacterPage from "./pages/CharacterPage";
import { useEffect } from "react";

import { useGoogleAuth} from "./context/GoogleAuthContext";

export default function StoryOrganizer() {

  const { initialize } = useGoogleAuth();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("Google Client ID is missing");
      return;
    }

    initialize(clientId);
  }, []);

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
          element={<BookPage />} 
        />
        <Route
          path="book/:currentBookId/:characterSlug"
          element={<CharacterPage />}
        />
      </Route>
    </Routes>
  );
}


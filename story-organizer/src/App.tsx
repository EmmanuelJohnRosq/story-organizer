import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import UserPage from "./pages/UserPage";
import BookPage from "./pages/BookPage";
import ExperimentPage from "./pages/ExperimentPage";
import CharacterPage from "./pages/CharacterPage";
import { useEffect } from "react";

import { useGoogleAuth} from "./context/GoogleAuthContext";
import { findBackupFile } from "./services/driveService";

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
  }, []);

  // THIS IS FOR SETTING FILE NAME OF SAVED JSON FROM GOOGLE DRIVE
  useEffect(() => {
  const checkBackup = async () => {
    const token = localStorage.getItem("googleAccessToken");
    if (!token) return;

    try {
      const file = await findBackupFile(token);
      if (file) {
        localStorage.setItem("googleFileID", file.id);
      }
    } catch (err) {
      console.error("Drive check failed");
    }
  };

  checkBackup();
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
        {/* <Route 
          path="book/:currentBookId/experiment" 
          element={<ExperimentPage />} 
        /> */}
        <Route 
          path="book/:currentBookId/" 
          element={<ExperimentPage />} 
        />
        <Route
          path="book/:currentBookId/:characterSlug"
          element={<CharacterPage />}
        />
      </Route>
    </Routes>
  );
}


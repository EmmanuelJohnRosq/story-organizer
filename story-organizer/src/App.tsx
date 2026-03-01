import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import UserPage from "./pages/UserPage";
import BookPage from "./pages/BookPage";
import CharacterPage from "./pages/CharacterPage";


export default function StoryOrganizer() {
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


import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback, useRef, use } from "react";

import { db, type Book, type Character, type EditableCharacter, type Notes, type CharacterDescription } from "../db";

export default function CharacterPage() {
  const { selectedCharacterId } = useParams();
  if (!selectedCharacterId) return <div> No Book selected... </div>;

  async function getChar() {
    const get = await db.characters.get(selectedCharacterId);
    console.log(get);
    console.log(selectedCharacterId);
  }

  return (
    <div className="flex justify-center bg-green-500 w-full h-full">
      <div className="flex place-items-center bg-red-500 text-2xl w-100 h-100 text-black">
        <button className="w-50 h-25 bg-blue-400 rounded-2xl hover:scale-105 hover:bg-blue-500" onClick={() => getChar()}>
          Click
        </button>
      </div>
    </div>

  );
}
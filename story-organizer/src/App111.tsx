import { useState, useEffect  } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

type Character = {
  id: number;
  name: string;
  role: string;
  race: string;
  age: string;
  powerLevel: string;
  notes: string;
};

export default function StoryOrganizer() {
    const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem("characters");
    return saved ? JSON.parse(saved) : [];
  }); 

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [race, setRace] = useState("");
  const [age, setAge] = useState("");
  const [powerLevel, setPower] = useState("");

  useEffect(() => {
    localStorage.setItem("characters", JSON.stringify(characters));
  }, [characters]);

  function addCharacter(): void {
    if (!name) return;

      const newCharacter: Character = {
        id: Date.now(),
        name,
        role,
        age,
        race,
        powerLevel,
        notes,
        // ADD LATER
        // relationships
        // abilities
        // connections
       
    };

    setCharacters([...characters, newCharacter]);
    setName("");
    setRole("");
    setRace("");
    setAge("");
    setPower("");
    setNotes("");
    
  }

  function deleteCharacter(id: number): void {
    setCharacters(characters.filter(c => c.id !== id));
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">📖 Story Organizer</h1>

      <div className="bg-white shadow rounded-2xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Add Character</h2>
        {/* Input NAME */}
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {/* Input ROLE */}
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Role / Affiliation"
          value={role}
          onChange={e => setRole(e.target.value)}
        />
        {/* Input Race */}
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Race"
          value={race}
          onChange={e => setRace(e.target.value)}
        />
        {/* Input Age */}
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Age"
          value={age}
          onChange={e => setAge(e.target.value)}
        />
        {/* Input Power Level */}
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Power Level"
          value={powerLevel}
          onChange={e => setPower(e.target.value)}
        />
        {/* Input Notes */}
        <textarea
          className="border p-2 w-full mb-2 rounded"
          placeholder="Notes (abilities, secrets, relationships…)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <button onClick={addCharacter} className="bg-black text-white px-4 py-2 rounded-xl">Add Character</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {characters.map(char => (
          <div key={char.id} className="bg-white shadow rounded-2xl p-4">
            <h3 className="text-xl font-bold">{char.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{char.role} | {char.race} | {char.age} | {char.powerLevel}</p>
            <p className="whitespace-pre-wrap">{char.notes}</p>
            <button onClick={() => deleteCharacter(char.id)} className="text-red-500 mt-3"> Delete </button>
          </div>
        ))}
      </div>
    </div>
  );
}


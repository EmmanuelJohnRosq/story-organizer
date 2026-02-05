import { useState, useEffect } from "react";

type Character = {
  id: number;
  name: string;
  role: string;
  notes: string;
  abilities: string[];
  arcStage: string;
  relationships: { name: string; type: string }[];
};

type EditableCharacter = Character & {
  abilitiesText: string;
};

type Book = {
  id: number;
  title: string;
  characters: Character[];
};

export default function StoryOrganizer() {
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem("books");
    return saved ? JSON.parse(saved) : [];
  });

  // Constant Variables
  const [currentBookId, setCurrentBookId] = useState<number | null>(null);
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<EditableCharacter | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [setDrag, setIsDragOver] = useState(false);

  const [bookTitle, setBookTitle] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [abilities, setAbilities] = useState("");
  const [arcStage, setArcStage] = useState("");

  const [theme, setTheme] = useState<'default'|'fantasy'|'scifi'|'horror'|'romance'|'xianxia'>('default');
//   const [darkMode, setDarkMode] = useState(false);

  const currentBook = books.find(book => book.id === currentBookId);

  // Background styles for themes
  const themeBackgrounds: Record<string, string> = {
      default: 'bg-gradient-to-b from-white-100 to-white-50',
      fantasy: 'bg-gradient-to-b from-green-200 to-yellow-50',
      scifi: 'bg-gradient-to-b from-zinc-100 to-zinc-800',
      horror: 'bg-gradient-to-b from-red-500 to-gray-900',
      romance: 'bg-gradient-to-b from-pink-400 to-pink-200',
      xianxia: 'bg-gradient-to-b from-blue-300 to-green-100',
  };

  const appliedTheme = themeBackgrounds[theme] || themeBackgrounds.fantasy;

  
  // DRAG AND DROP TO DELETE BOOK CARDS
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("bookId", e.currentTarget.dataset.id!);
    e.dataTransfer.setData("bookTitle", e.currentTarget.dataset.title!);

    const bookId = e.dataTransfer.getData("bookId");
    setDraggingId(+bookId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent default to allow drop
    setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 

    const bookId = e.dataTransfer.getData("bookId");
    const bookTitle = e.dataTransfer.getData("bookTitle");

    if (!bookId) return;

    if (!confirm("Do you want to delete '" + bookTitle + "' book?")) {
      setIsDragOver(false);
      return;
    }
 
    setBooks(prevBooks =>
      prevBooks.filter(book => book.id !== +bookId)
    );
    setIsDragOver(false);
  }

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  useEffect(() => {
    localStorage.setItem("books", JSON.stringify(books));
  }, [books]);

  // FEATURE FUNCTIONS
  // create new book
  function addBook() {
    if (!bookTitle) return;
    const newBook: Book = {
      id: Date.now(),
      title: bookTitle,
      characters: [],
    };
    setBooks([...books, newBook]);
    setBookTitle("");
  }
  // select book element
  function selectBook(id: number) {
    setCurrentBookId(id);
    setShowAddCharacter(false);
  }

  // create new character block
  function addCharacter() {
    if (!name || currentBookId === null) return;

    const newCharacter: Character = {
      id: Date.now(),
      name,
      role,
      notes,
      abilities: abilities.split(",").map(a => a.trim()),
      arcStage,
      relationships: [],
    };

    setBooks(books.map(book => book.id === currentBookId ? {...book, characters: [...book.characters, newCharacter]} : book));

    setName("");
    setRole("");
    setNotes("");
    setAbilities("");
    setArcStage("");
    setShowAddCharacter(false);
  }

  // Show Edit Modal
  function showModal(state: boolean) {
    setShowEditModal(state);
    document.body.classList.toggle('overflow-hidden', state);
  }

  // delete character block
  function deleteCharacter(characterId: number) {
    if (currentBookId === null) return;

    const confirmed = window.confirm("Are you sure you want to delete this character?");

    if (!confirmed) return;
      setBooks(
          books.map(book => book.id === currentBookId ? {...book, characters: book.characters.filter(c => c.id !== characterId)} : book)
      );
    showModal(false);
  }

  // open edit Char Modal
  function openEditCharacter(character: Character) {
    setEditingCharacter({ ...character, abilitiesText: character.abilities.join(", ")
  } as Character & { abilitiesText : string });
    showModal(true);
  }

  // update/edit Char details
  function updateCharacter() {
    if (!editingCharacter || currentBookId === null || !editingCharacter.name.trim()) return;

    const updatedCharacter: Character = { ...editingCharacter, 
      abilities: editingCharacter.abilitiesText.split(", ").map(a=> a.trim()).filter(Boolean)
    };

    setBooks(
      books.map(book => book.id === currentBookId ? {
        ...book, characters: book.characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c) 
      } : book )
    );

    showModal(false);
  }


  // HTML/TAILWIND CSS | INDEX
  return (
    <div className="PARENT MAIN ROOT Component">
      <div className={`${appliedTheme} relative min-h-screen transition-colors duration-800 p-6 min-w-4xl mx-auto backdrop-blur-lg`}>
        <div className="fixed inset-0 bg-cover bg-center opacity-50 -z-10 transition-opacity duration-800" style={{backgroundImage: `url(/textures/${theme}.png)`}}/>
          <div className={"max-w-4xl mx-auto"}>
              
            {/* Title/Menu */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">📖 Story Organizer</h1>

                <div className="flex gap-2">
                    <select value={theme} onChange={e => setTheme(e.target.value as any)} className="cursor-pointer border font-bold rounded px-2 py-1">
                        <option value="default">Default</option>
                        <option value="fantasy">Fantasy</option>
                        <option value="scifi">Sci-Fi</option>
                        <option value="horror">Horror</option>
                        <option value="romance">Romance</option>
                        <option value="xianxia">Xianxia</option>
                    </select>
                </div>

            </div>

            {/* BOOK LIST / HOMEPAGE */}
            {currentBookId === null && (
                <div>
                  <h2 className="text-2xl font-semibold mb-2">My Books</h2>
                  
                  <div className="mb-4 flex gap-2">
                      <input
                      className="border px-3 py-3 w-full rounded-xl"
                      placeholder="New Book Title"
                      value={bookTitle}
                      onChange={e => setBookTitle(e.target.value)}
                      />
                      <button onClick={addBook} className="bg-black text-white px-8 py-1 rounded-xl cursor-pointer hover:scale-105">
                      Add Book
                      </button>
                      <div className={`bg-red-500 text-white px-2 py-2 rounded-xl ${setDrag === true ? "scale-120 opacity-80" : ""}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragLeave={handleDragLeave}
                        >
                       Drag here to delete  🗑️ 
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {books.map(book => ( 
                      <div 
                        key={book.id} 
                        draggable
                        onDragStart={handleDragStart}
                        data-id={book.id}
                        data-title={book.title}
                        onDragEnd={() => setDraggingId(null)}
                        className={`
                          shadow-lg bg-white shadow rounded-2xl p-4 
                          hover:scale-105
                          transition-all duration-200 ease-out
                          cursor-grab active:cursor-grabbing
                          ${draggingId === book.id ? "opacity-0" : ""}
                          `}
                        onClick={() => selectBook(book.id)}>
                          <h3 className="text-xl font-bold">{book.title}</h3>
                          <p className="text-sm text-gray-500">{book.characters.length} Characters</p>
                      </div>
                      ))}
                  </div>
                </div>
            )}

            {/* DETAILS / CHARACTERS */}
            {currentBookId !== null && currentBook && (
                <div>
                <button onClick={() => setCurrentBookId(null)} className="text-blue-500 mb-4">← Back to Books</button>

                <h2 className="text-2xl font-semibold mb-4">{currentBook.title}</h2>

                <button onClick={() => setShowAddCharacter(!showAddCharacter)} className="bg-black text-white px-4 py-2 rounded-xl mb-4">
                    {showAddCharacter ? 'Cancel' : 'Add Character'}
                </button>

                {/* Input Character Details */}
                {showAddCharacter && (
                    <div className="bg-white shadow rounded-2xl p-4 mb-6">
                    <input className="border p-2 w-full mb-2 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    <input className="border p-2 w-full mb-2 rounded" placeholder="Role / Affiliation" value={role} onChange={e => setRole(e.target.value)} />
                    <textarea className="border p-2 w-full mb-2 rounded" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
                    <input className="border p-2 w-full mb-2 rounded" placeholder="Abilities (comma separated)" value={abilities} onChange={e => setAbilities(e.target.value)} />
                    <input type="number" className="border p-2 w-full mb-2 rounded" placeholder="Arc Stage" value={arcStage} onChange={e => setArcStage(e.target.value)} />
                    <button onClick={addCharacter} className="bg-black text-white px-4 py-2 rounded-xl">Add Character</button>
                    </div>
                )}

                {/* Display Character Card Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentBook.characters.map(char => (

                    // Main Char Box
                    // hover:bg-gray-200 shadow rounded-2xl p-4 rounded-lg shadow-lg cursor-pointer transition duration-300
                    <div key={char.id} 
                    className="cursor-pointer bg-white shadow rounded-2xl p-4 
                    character-card hover:scale-105 transition"
                    onClick={() => openEditCharacter(char)}>

                        <h3 className="text-xl font-bold">{char.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{char.role}</p>
                        <p className="whitespace-pre-wrap mb-2">{char.notes}</p>
                        <p className="text-sm mb-1">Abilities: {char.abilities.join(", ")}</p>
                        <p className="text-sm mb-1">Volume: {char.arcStage}</p>
                    </div>
                    ))}
                </div>
                </div>
            )}

          </div>
      </div>

            {/* EDIT MODAL & Char update */}
            {showEditModal && editingCharacter && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={() => showModal(false)}>
                  <div className="bg-white dark:bg-gray-100 max-h-[90vh] overflow-y-auto p-6 rounded-xl w-96 shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-x1 font-bold mb-4">Edit Character</h2>

                    {/* Name */}
                    <input 
                      className="w-full border p-2 rounded mb-3" 
                      value={editingCharacter.name} 
                      onChange={e => setEditingCharacter({ ...editingCharacter, name: e.target.value })
                      }
                      placeholder="Character Name" 
                    />

                    {/* Role */}
                    <input 
                      className="w-full border p-2 rounded mb-3" 
                      value={editingCharacter.role} 
                      onChange={e => setEditingCharacter({ ...editingCharacter, role: e.target.value })
                      }
                      placeholder="Role" 
                    />

                    {/* Description */}
                    <textarea
                      className="w-full min-h-25 border p-2 rounded mb-3"
                      value={editingCharacter.notes}
                      onChange={e => setEditingCharacter({ ...editingCharacter, notes: e.target.value })
                      }
                      placeholder="Notes"
                    />

                    {/* Abilities */}
                    <input 
                      className="w-full border p-2 rounded mb-3" 
                      value={editingCharacter.abilitiesText} 
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, abilitiesText: e.target.value })
                      }
                      placeholder="Abilities"
                    />

                    {/* Volume */}
                    <input 
                      type="number"
                      className="w-full border p-2 rounded mb-3" 
                      value={editingCharacter.arcStage} 
                      onChange={e => setEditingCharacter({ ...editingCharacter, arcStage: e.target.value })
                      }
                      placeholder="Volume" 
                    />

                    {/* Buttons */}
                    <div className="flex justify-between mt-4">

                      <button
                        onClick={() => deleteCharacter(editingCharacter.id)}
                        className="text-red-500"
                      > Delete
                      </button>

                      <div className="space-x-2">
                        <button
                          onClick={() => showModal(false)}
                          className="px-4 py-1 border rounded"
                        > Cancel
                        </button>

                        <button
                          onClick={updateCharacter}
                          className="px-4 py-1 bg-blue-500 text-white rounded"
                        > Save
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
            )}

    </div>
  );
}


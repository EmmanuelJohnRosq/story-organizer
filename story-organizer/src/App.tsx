import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExport } from "@fortawesome/free-solid-svg-icons";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";

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
  const [draggingId, setDraggingId] = useState<number | null>(null);

  // EDITING OF BOOK TITLE
  const [titleDraft, setTitleDraft] = useState("");
  const [savedTitle, setSavedTitle] = useState(false);

  // MODALS
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  // IMPORT Variables
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // USER DRAGGIN STATE
  const [setDrag, setIsDragOver] = useState(false);
  const [isDraggingBook, setIsDraggingBook] = useState(false);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFile(acceptedFiles[0]); // 🔥 THIS triggers re-render
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const [bookTitle, setBookTitle] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [abilities, setAbilities] = useState("");
  const [arcStage, setArcStage] = useState("");

  const [theme, setTheme] = useState<'default'|'fantasy'|'scifi'|'horror'|'romance'|'xianxia'>('default');
//   const [darkMode, setDarkMode] = useState(false);

  const currentBook = books.find(book => book.id === currentBookId);

  // EXPORT DATA/SAVE TO Json FILE
  const exportData = () => {
    const name = prompt("Enter file name", "story-organizer");
    if (!name) return;

    const data = {
      app: "story-organizer",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      books,
    }; 

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();

    URL.revokeObjectURL(url);
  };

  // IMPORT DATA/SAVE File
  const importData = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        setBooks(parsed.books);
      } catch {
        alert("Invalid file format");
      }
    };

    reader.readAsText(file);
    showModalFile(false);
  }

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

    e.dataTransfer.effectAllowed = "move";
    
    setIsDraggingBook(true);

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
      setIsDraggingBook(false)
      return;
    }
 
    setBooks(prevBooks =>
      prevBooks.filter(book => book.id !== +bookId)
    );
    setIsDragOver(false);
    setIsDraggingBook(false)
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

  // Show IMPORT/EXPORT MODAL
  function showModalFile(state: boolean) {
    setShowFileModal(state);
    setSelectedFile(null);
    document.body.classList.toggle('overflow-hidden', state);
  } 

  // delete character block
  function deleteCharacter(characterId: number) {
    if (currentBookId === null) return;

    const confirmed = window.confirm("Remove this character? No takebacks.");

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

  // BOOK TITLE CHANGES - CHANGEABLE INPUT DATA
  useEffect(() => {
    if (currentBook) {
      setTitleDraft(currentBook.title);
    }
  }, [currentBook]);

  function saveBookTitle() {
    if (!titleDraft.trim() || titleDraft.trim() === currentBook?.title) {
      setTitleDraft(currentBook!.title); //Revert to previous title'
      setSavedTitle(false);
      return;
    }

    setBooks(
      books.map(book => book.id === currentBookId ? {
        ...book, title: titleDraft.trim() 
      } : book )
    );

    setSavedTitle(true);
    setTimeout(() => setSavedTitle(false), 2000);
  }


  // HTML/TAILWIND CSS | INDEX
  return (
    <div className="PARENT MAIN ROOT Component">
      
      <div className={`${appliedTheme} relative min-h-[100dvh] w-full min-w-0 md:min-w-4xl mx-auto px-4 transition-colors duration-800 backdrop-blur-lg overflow-hidden`}>
        <div className="fixed inset-0 bg-cover bg-center opacity-50 -z-10 transition-opacity duration-800" style={{backgroundImage: `url(/textures/${theme}.png)`}}/>
          <div className="w-full md:max-w-4xl sm-w-full mx-auto min-h-screen border-b border-transparent">

            {/* STICK THE TRASHCAN TO THE BOTTOM OF THE PAGE FOR DELETION */}
            {/* <div className="text-3xl font-bold sticky z-50 bottom-0 right-0 left-0">

                <div className={`relative group inline-block bg-red-200 px-2 py-2 border border-red-300 rounded-xl hover:bg-red-300 ${setDrag === true ? "scale-110 opacity-80" : ""}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={handleDragLeave}
                  >
                    <FontAwesomeIcon className="opacity-0 group-hover:opacity-100 absolute" icon={faTrashCan} bounce size="2xl"/>
                    <FontAwesomeIcon className="opacity-100 group-hover:opacity-0" icon={faTrashCan} size="2xl"/>

                    <span
                      className="
                        absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                        hidden group-hover:inline
                        pointer-events-none
                        transition-opacity duration-200
                        bg-black/80 text-white text-xs px-2 py-1 rounded-md
                        whitespace-nowrap
                      ">
                      Drag Book cards here to remove.
                    </span>
                </div>
            </div> */}
              
            {/* Title/Menu */}
            <div className="flex justify-between items-center mb-6 mt-5">
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

                  {/* EXPORT/IMPORT BUTTON */}
                  <div className="relative group inline-block">
                    <button 
                      className="cursor-pointer p-1 hover:scale-115 transition" 
                      onClick={() => showModalFile(true)} > 
                      <FontAwesomeIcon icon={faFileExport} size="xl" />
                    </button>

                    {/* TOOLTIP */}
                    <div
                      className="
                        absolute top-full left-1/2 -translate-x-1/2 mt-2
                        opacity-0 group-hover:opacity-100
                        pointer-events-none
                        transition-opacity duration-200
                        bg-black/80 text-white text-xs px-2 py-1 rounded-md
                        whitespace-nowrap
                      ">
                      Import/Export File
                    </div>
                  </div>

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
                      onKeyDown={(e) => {
                          if (e.key === "Enter") addBook();
                        }}
                      />
                      <button 
                        onClick={addBook} 
                        className="bg-black border border-black text-white px-5 py-1 rounded-xl cursor-pointer hover:bg-gray-800 transition"
                      >
                      Add Book
                      </button>

                  </div>

                    {/* SHOW BOOK LIST */}
                  {/* BOOK CARDS */}
                  <div className="grid grid-cols-3 gap-4 mb-5 place-items-center">
                      {books.map(book => (
                      <div
                        key={book.id} 
                        draggable
                        onDragStart={handleDragStart}
                        data-id={book.id}
                        data-title={book.title}
                        onDragEnd={() => { setDraggingId(null); setIsDraggingBook(false);}}
                        onClick={() => selectBook(book.id)}
                        className={`
                          relative group cursor-pointer
                          w-55 h-70 rounded-tl-xl rounded-bl-xl
                          bg-gradient-to-br from-gray-100 to-gray-50
                          shadow-lg
                          hover:-translate-y-2 hover:shadow-2xl
                          transition-all duration-300
                          ${draggingId === book.id ? "opacity-0" : ""}
                          `}>
                        {/* Spine and bottom pages design */}
                        <div
                          className="absolute -bottom-0 w-full h-0.5
                            bg-gray-400
                            rounded-tl-lg"/>
                        <div
                          className="absolute -left-1 top-0 h-full w-4
                            bg-gray-400
                            rounded-tl-lg"/>
                        

                        {/* Title */}
                        <div className="p-4 pt-15 text-center font-semibold text-gray-800 line-clamp-5 max-h-45">
                          {book.title}

                          {/* Vertical TITLE */}
                          <div className="absolute text-white text-outline-2 -left-2 top-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-rl] truncate line-clamp-1 max-h-50">
                            <span className="text-xs font-bold">{book.title}</span>
                          </div>
                        </div>
                        <p className="text-center text-gray-500">{book.characters.length} Characters</p>
                        
                      </div>
                      ))}
                  </div>
                  


                </div>
            )}

            {/* DETAILS / CHARACTERS */}
            {currentBookId !== null && currentBook && (
                <div>
                  <div>
                    <button onClick={() => setCurrentBookId(null)} className="text-blue-500 mb-4 cursor-pointer hover:scale-103 hover:underline">← Back to Books</button>
                  </div>
                
                  {/* Conditional "Changes Saved" message */}
                  <div className="absolute mt-7">
                    {savedTitle && (
                      <span className="mt-2 text-sm text-green-600 font-semibold animate-pulse">
                        Changes Saved!
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    {/*CHANGEABLE CURRENT BOOK TITLE */}
                    <div className="flex-1">
                      <input 
                        className="text-2xl w-full font-semibold border-b-2 border-gray-100 hover:border-gray-600 outline-none focus-ring-0 truncate" 
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={saveBookTitle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveBookTitle();
                        }}
                      />

                    </div>

                    <button onClick={() => setShowAddCharacter(!showAddCharacter)} className="bg-black border border-black text-white px-5 py-2 rounded-xl cursor-pointer hover:bg-gray-800 transition">
                        {showAddCharacter ? 'Cancel' : 'Add Character'}
                    </button>
                  </div>

                  {/* Input Character Details */}
                  {showAddCharacter && (
                      <div className="bg-white/30 shadow rounded-2xl p-4 mb-6 flow-root">
                        <input className="border p-2 w-full mb-2 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                        <input className="border p-2 w-full mb-2 rounded" placeholder="Role / Affiliation" value={role} onChange={e => setRole(e.target.value)} />
                        <textarea className="border p-2 w-full mb-2 rounded" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
                        <input className="border p-2 w-full mb-2 rounded" placeholder="Abilities (comma separated)" value={abilities} onChange={e => setAbilities(e.target.value)} />
                        <input type="number" className="border p-2 w-full mb-2 rounded" placeholder="Arc Stage" value={arcStage} onChange={e => setArcStage(e.target.value)} />
                        <button onClick={addCharacter} className="float-right bg-black border border-black text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-gray-800 transition">Confirm</button>
                      </div>
                  )}

                  {/* Display Character Card Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {currentBook.characters.map(char => (

                      // Main Char Box
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
                  <div className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-100 max-h-[90vh] overflow-y-auto p-6 rounded-xl shadow-lg" onClick={(e) => e.stopPropagation()}>
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

                      <div className="hover:transition flex group">
                        <button onClick={() => deleteCharacter(editingCharacter.id)}>
                          <FontAwesomeIcon className="opacity-0 cursor-pointer group-hover:opacity-100 absolute text-red-500" icon={faTrashCan} bounce size="xl"/>
                          <FontAwesomeIcon className="opacity-100 cursor-pointer group-hover:opacity-0" icon={faTrashCan} size="xl"/>
                        </button>
                      </div>

                      <div className="space-x-2">
                        <button
                          onClick={() => showModal(false)}
                          className="px-4 py-1 border rounded-lg hover:bg-red-300/50 cursor-pointer"
                        > Cancel
                        </button>

                        <button
                          onClick={updateCharacter}
                          className="px-4 py-1 bg-blue-500 text-white border border-black rounded-lg hover:bg-blue-600 cursor-pointer"
                        > Save
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
            )}

            {/* EXPORT/IMPORT MODAL */}
            {showFileModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={() => showModalFile(false)}>
                  <div className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-100 max-h-[90vh] overflow-y-auto p-6 rounded-xl shadow-lg" onClick={(e) => e.stopPropagation()}>
                    
                    {/* DOWNLOAD YOUR DATA as JSON */}
                    <div className="flex justify-between">
                      <div>
                        <h2 className="text-x1 font-bold">SAVE YOUR BOOKS</h2>
                        <p className="text-sm text-gray-500">From your impulsive actions, save your file now.</p>
                      </div>
                      <div className="px-2">
                        <button
                          onClick={exportData}
                          className="border bg-blue-500 px-4 py-2 text-white rounded-xl cursor-pointer hover:border hover:border-blue-900"> 
                          Export Books
                        </button>
                      </div>
                    </div>

                    {/* DIVIDER LINE OR */}
                    <div className="my-6 flex items-center">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="mx-4 text-sm text-gray-500 font-medium">OR</span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    {/* UPLOAD YOUR DOWNLOADED JSON FILE TO use in OTHER BROWSER */}
                    <div className="flex items-center justify-center w-full">
                        <div 
                          {...getRootProps()}
                          className={`flex flex-col items-center justify-center w-full h-35 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-base cursor-pointer hover:bg-neutral-tertiary-medium ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}>
                            <input {...getInputProps()} 
                              accept=".json"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                setSelectedFile(e.target.files[0]);
                                }
                              }}
                            />

                            {selectedFile ? (
                              <span className="text-lg text-gray-500 truncate max-w-100">
                                  {selectedFile.name}
                                </span>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                                  <svg className="w-8 h-8 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/></svg>
                                  <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span></p>
                                  <p className="text-xs">Exported file only, Json file.</p>
                              </div>
                            )}
                        </div>
                    </div> 

                    {/* Submit */}
                      <div className="flex justify-between mt-3">
                        <div>
                          <h2 className="text-x1 font-bold">EXTRICATE YOUR CHARACTERS</h2>
                          <p className="text-sm text-gray-500">From your own chaotic life, upload now.</p>
                        </div>
                        <div className="px-2">
                          <button
                            disabled={!selectedFile}
                            onClick={() => importData(selectedFile!)}
                            className="border bg-blue-500 px-4 py-2 text-white rounded-xl cursor-pointer hover:border hover:border-blue-900 disabled:opacity-40 disabled:cursor-not-allowed
                            text-white"> 
                            Import Books
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
            )}

            {/* TRASHCAN FEATURE/DELETION OF BOOK CARD ONDROP */}
            {isDraggingBook && (
              <div
                className="
                  fixed bottom-6 right-6 z-50
                  transition-all duration-300
                  scale-100 opacity-100
                "
              >
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={handleDragLeave}
                  className={`
                    w-20 h-20
                    group flex items-center justify-center
                    rounded-full
                    px-2 py-2 border border-red-300
                    bg-red-300
                    text-white
                    shadow-xl
                    hover:scale-110
                    hover:bg-red-500
                    transition-transform
                    ${setDrag ? "scale-110 bg-red-500" : ""}
                  `}
                > 
                <FontAwesomeIcon 
                icon={faTrashCan} 
                size="2xl"
                bounce={isDraggingBook && !setDrag}
                />
                </div>

                {/* TOOLTIP */}
                <span
                  className={`
                    ${setDrag === true ? "hidden" : ""}
                    absolute right-full bottom-6 mr-2
                    pointer-events-none
                    transition-opacity duration-200
                    bg-black/80 text-white text-xs px-2 py-1 rounded-md
                    whitespace-nowrap
                  `}
                  >
                  DROP BOOKS HERE TO REMOVE.
                </span>
              </div>
            )}

            {/* CUSTOM MODAL FOR CONFIRM/CANCEL */}

    </div>
  );
}


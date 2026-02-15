import { useState, useEffect, useCallback, useRef } from "react";
import { db, type Book, type Character, type EditableCharacter, type Images } from "./db";


import { useDropzone } from "react-dropzone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport } from "@fortawesome/free-solid-svg-icons";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import { GoogleGenAI } from "@google/genai";


export default function StoryOrganizer() {

  const [books, setBooks] = useState<Book[]>([]);
  const [images, setImages] = useState<Images[]>([]);

  // Constant Variables
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // CHARACTER DATA
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<EditableCharacter | null>(null);
  const [charEditing, setcharEditing] = useState(false);
  const [originalCharacter, setOriginalCharacter] = useState<Character | null>(null);
  const [onChange, setonChange ] = useState(false);

  // EDITING OF BOOK TITLE
  const [titleDraft, setTitleDraft] = useState("");
  const [savedTitle, setSavedTitle] = useState(false);
  const [bookAdded, setBookAdded] = useState(false);

  // MODALS
  const [showGenImage, setShowGenImage] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  // IMPORT Variables
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // HEADER SCROLL VARIABLES
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

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

  // const [theme, setTheme] = useState<'default'|'fantasy'|'scifi'|'horror'|'romance'|'xianxia'>('default');

  const currentBook = books.find(book => book.id === currentBookId);

  // UseEFFECT FUNCTIONS
  useEffect(() => {
    const loadBooks = async () => {
      const allBooks = await db.books.toArray();
      allBooks.sort((a, b) => a.createdAt - b.createdAt);
      setBooks(allBooks);
    };

    loadBooks();
  }, []);

  function normalizeWhitespace(text: string) {
    return text
      .trim()                // remove start/end spaces
      .replace(/\s+/g, " "); // collapse multiple spaces into one
  }

  function sanitizeCharacter(char: EditableCharacter): Character {
  return {
    ...char,
    name: normalizeWhitespace(char.name),
    role: normalizeWhitespace(char.role),
    notes: char.notes.trim().replace(/[^\S\r\n]+/g, " "),
    arcStage: normalizeWhitespace(char.arcStage),
    abilities: char.abilitiesText
      .split(",")
      .map(a => normalizeWhitespace(a),)
      .filter(a => a.length > 0) // removes empty ones
  };
}

// Conver blob to base64 for image
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


// Convert base64 to blob
const base64ToBlob = (base64: string) => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
};

  // EXPORT DATA/SAVE TO Json FILE
const exportData = async () => {
  const name = prompt("Enter file name", "story-organizer");
  if (!name) return;

  const imageRecords = await db.images.toArray();

  // Convert blobs to base64
  const imagesWithBase64 = await Promise.all(
    imageRecords.map(async (img) => ({
      imageId: img.imageId,
      charId: img.charId,
      createdAt: img.createdAt,
      base64: await blobToBase64(img.imageBlob),
    }))
  );

    const data = {
      app: "story-organizer",
      version: "2.0",
      exportedAt: new Date().toISOString(),
      books,
      images: imagesWithBase64,
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
  const importData = async (file: File) => {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    // Clear old data
    await db.books.clear();
    await db.images.clear();

    // Restore books
    await db.books.bulkAdd(parsed.books);

    // Restore images (if they exist)
    if (parsed.images && parsed.images.length > 0) {
      const restoredImages = parsed.images.map((img: any) => ({
        imageId: img.imageId,
        charId: img.charId,
        createdAt: img.createdAt,
        imageBlob: base64ToBlob(img.base64),
      }));

      await db.images.bulkAdd(restoredImages);
    }

    setBooks(parsed.books);

    alert("Import successful!");
  } catch (err) {
    console.error(err);
    alert("Invalid file format");
  }

  showModalFile(false);
  setCurrentBookId(null);
  setSelectedCharacter(null);
};

  // Background styles for themes
  // const themeBackgrounds: Record<string, string> = {
  //     default: 'bg-gradient-to-b from-white-100 to-white-50',
  //     fantasy: 'bg-gradient-to-b from-green-200 to-yellow-50',
  //     scifi: 'bg-gradient-to-b from-zinc-100 to-zinc-800',
  //     horror: 'bg-gradient-to-b from-red-500 to-gray-900',
  //     romance: 'bg-gradient-to-b from-pink-400 to-pink-200',
  //     xianxia: 'bg-gradient-to-b from-blue-300 to-green-100',
  // };

  // const appliedTheme = themeBackgrounds[theme] || themeBackgrounds.fantasy;

  
  // DRAG AND DROP TO DELETE BOOK CARDS
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("bookId", e.currentTarget.dataset.id!);
    e.dataTransfer.setData("bookTitle", e.currentTarget.dataset.title!);

    e.dataTransfer.effectAllowed = "move";
    
    setIsDraggingBook(true);

    const bookId = e.dataTransfer.getData("bookId");
    setDraggingId(bookId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent default to allow drop
    setIsDragOver(true);
  };

  async function deleteBook(id: string) {
    if(!id) return;
    
    await db.books.delete(id);

    setBooks(prev => prev.filter(book => book.id !== id));
    
    setIsDragOver(false);
    setIsDraggingBook(false);
  }

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

    deleteBook(bookId);
  }

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // CREATE NEW BOOK/ ASYNC WITH DEXIEDB
  async function addBook() {
    const normalizedTitle = normalizeWhitespace(bookTitle);

    if (!normalizedTitle) return;

    const existing = await db.books
      .where("title")
      .equalsIgnoreCase(normalizedTitle)
      .first();

    if (existing) {
      alert("Book with this name already exists.");
      setBookTitle("");
      return;
    }

    const newBook = {
      id: crypto.randomUUID(),
      title: normalizedTitle,
      characters: [],
      createdAt: Date.now(),
    };

    // Save to IndexedDB
    const id = await db.books.add(newBook);

    // Update React state
    setBooks(prev => [...prev, { ...newBook, id }]);

    // UI stuff (keep these)
    setBookTitle("");
    setBookAdded(true);
    setTimeout(() => setBookAdded(false), 2000);
  }

  // select book element
  function selectBook(id: string) {
    setCurrentBookId(id);
    setShowAddCharacter(false);
  }

  // create new character block Dexie
  async function addCharacter() {
    if (!name || currentBookId === null) return;

    const newCharacter: Character = {
      id: Date.now(),
      name: normalizeWhitespace(name),
      role: normalizeWhitespace(role),
      notes: notes.trim().replace(/[^\S\r\n]+/g, " "),
      abilities: abilities.split(",").map(a => normalizeWhitespace(a)),
      arcStage: normalizeWhitespace(arcStage),
      relationships: [],
    };

    const book = books.find(b => b.id === currentBookId);
    if (!book) return;

    const updatedCharacter = {
      ...book, characters: [...book.characters, newCharacter]
    };

    await db.books.put(updatedCharacter)

    setBooks(prev => prev.map(b => b.id === currentBookId ? updatedCharacter : b));

    setName("");
    setRole("");
    setNotes("");
    setAbilities("");
    setArcStage("");
    setShowAddCharacter(false);
  }

  // Show Edit Modal
  function showModal(state: boolean) {
    setShowGenImage(state);
    document.body.classList.toggle('overflow-hidden', state);
  }

  // Show IMPORT/EXPORT MODAL
  function showModalFile(state: boolean) {
    setShowFileModal(state);
    setSelectedFile(null);
    document.body.classList.toggle('overflow-hidden', state);
  } 

  // delete character block
  async function deleteCharacter(characterId: number) {
    if (currentBookId === null) return;

    const confirmed = window.confirm("Remove this character? No takebacks.");

    if (!confirmed) return;

    const book = books.find(book => book.id === currentBookId);
    if (!book) return;

    const updatedBook = {
      ...book, characters: book.characters.filter(c => c.id !== characterId)
    };

    await db.books.put(updatedBook);

    setBooks(prev => prev.map(b => b.id === currentBookId ? updatedBook : b));

    setSelectedCharacter(null);
  }

  // open edit Char Modal
  function openEditCharacter(characters: Character) {

    const selectedCharacter = { ...characters, abilitiesText: characters.abilities.join(", ")
    } as Character & { abilitiesText : string };
    
    setEditingCharacter({ ...selectedCharacter });

    setOriginalCharacter({ ...selectedCharacter });

    setSelectedCharacter(characters.id);
  }

  // update/edit Char details ? CHANGE THIS TO INSTANT CHANGE LIKE THE TITLE
  async function updateCharacter() {
    if (!editingCharacter || currentBookId === null || !editingCharacter.name.trim() || !originalCharacter) return;

    if (!onChange) return;

    setcharEditing(false)

    const cleanedCharacter = sanitizeCharacter(editingCharacter);

    const editableVersion: EditableCharacter = {
    ...cleanedCharacter,
    abilitiesText: cleanedCharacter.abilities.join(", ")
  };

    const updatedCharacter: Character = { ...cleanedCharacter, 
      abilities: cleanedCharacter.abilities
    };

    const book = books.find(b => b.id === currentBookId);
    if (!book) return;

    const updatedBook = {
    ...book,
    characters: book.characters.map(c =>
      c.id === cleanedCharacter.id ? updatedCharacter : c
    )
  };

    await db.books.put(updatedBook);

    setBooks(prev => prev.map(b => b.id === currentBookId ? updatedBook : b));
    setonChange(false);
    
    setOriginalCharacter({...cleanedCharacter});
    setEditingCharacter({ ...editableVersion });
  }


  // BOOK TITLE CHANGES - CHANGEABLE INPUT DATA
  useEffect(() => {
    if (currentBook) {
      setTitleDraft(currentBook.title);
    }
  }, [currentBook]);

  async function saveBookTitle() {
    if (!titleDraft.trim() || titleDraft.trim() === currentBook?.title) {
      setTitleDraft(currentBook!.title); //Revert to previous title'
      setSavedTitle(false);
      settitleEditing(false);
      return;
    }

    const titleUpdate = { title: normalizeWhitespace(titleDraft)};

    await db.books.update(currentBookId, titleUpdate);

    setBooks(prev => prev.map(book => book.id === currentBookId ? {...book, title: titleDraft.trim().replace(/\s+/g, " ")} : book));

    setSavedTitle(true);
    settitleEditing(true);
    // setTitleDraft(normalizeWhitespace(titleDraft));
    setTimeout(() => {setSavedTitle(false), settitleEditing(false)}, 2000);
  }

  const [char_image] = useState("/textures/char_images/default_char.jpg")

  // HEADER COLLAPSE AND SHOWS WHEN SCROLLED
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        // scrolling down
        setHeaderVisible(false);
      } else {
        // scrolling up
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [openSearch, setOpenSearch] = useState(false);
  const [titleEditing, settitleEditing] = useState(false);

  const [darktheme, setDarkTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    const html = document.documentElement;

    if (darktheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    localStorage.setItem("theme", darktheme);
  }, [darktheme]);

  const toggleTheme = () => {
    setDarkTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  // THIS IS THE IMAGE GENERATION PART - GEMINI
  // const genAI = new GoogleGenAI({
  //   apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  // });

  const [charprompt, setcharPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // const generateCharacter = async () => {
  //   if (!charprompt.trim()) return;

  //   setLoading(true);
  //   setError("");
  //   setImageUrl(null);

  //   try {
  //     const enhancedPrompt = `
  //     close portrait shot, shoulder up,
  //     ${charprompt},
  //     looking at camera,
  //     anime art style, 
  //     solid color background, centered composition.
  //     soft lighting
  //     `;

  //     //PROMPT: A young man, 18 years old. Black and white hair, sharp golden eyes, chiseled face. quite cold and handsome.

  //     const response = await genAI.models.generateContent({
  //       model: "gemini-2.5-flash-image",
  //       contents: enhancedPrompt,
  //       config: {
  //         responseModalities: ["Text","Image"],
  //       },
  //     });

  //     const imagePart = response.candidates?.[0]?.content?.parts?.find(
  //       (part: any) => part.inlineData
  //     );

  //     if (imagePart?.inlineData?.data) {
  //       const base64 = imagePart.inlineData.data;
  //       setImageUrl(`data:image/png;base64,${base64}`);
  //     } else {
  //       setError("No image returned.");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     setError("Failed to generate image.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const [imageSaved, setImageSaved] = useState<string | null>(null);

  //IMAGE GENERATION - PUTER.JS
  const generateImage = async () => {
    setLoading(true);
    setError("");
    try {
      const enhancedPrompt = `
      close portrait shot, shoulder up,
      ${charprompt},
      looking at camera,
      fantasy art style, 
      solid color background, centered composition.
      soft lighting
      `;

      // Use the puter.ai.txt2img function to generate an image
      const image = await puter.ai.txt2img(enhancedPrompt , {
            model: "gpt-image-1.5",
            quality: "low"
          });
      setImageUrl(image.src); // Puter returns an HTMLImageElement
      setImageSaved(image.src);
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function saveImage() {
    if (!imageSaved) return;

     // 1️⃣ Convert image URL to Blob
    const response = await fetch(imageSaved);
    const blob = await response.blob();

    // 2️⃣ Save Blob to IndexedDB
    await db.images.add({
      imageId: crypto.randomUUID(),
      charId: selectedCharacter!,
      imageBlob: blob,
      createdAt: Date.now()
    });

    const newUrl = URL.createObjectURL(blob);

    setImageMap(prev => ({
      ...prev,
      [selectedCharacter!]: newUrl
    }));

    setShowGenImage(false);
    setImageUrl(null);
    setcharPrompt("");

    // 3️⃣ Optional: Display preview
    // setImageUrl(URL.createObjectURL(blob));
    //PROMPT: A young man, 18 years old. Black and white hair, sharp golden eyes, chiseled face. quite cold and handsome.

  }

  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
  const loadImages = async () => {
    if (!currentBook?.characters?.length) return;

    const charIds = currentBook.characters.map(c => c.id);

    const images = await db.images
      .where("charId")
      .anyOf(charIds)
      .toArray();

    const newMap: Record<string, string> = {};

    images.forEach(img => {
      newMap[img.charId] = URL.createObjectURL(img.imageBlob);
    });

    setImageMap(newMap);
  };

  loadImages();
}, [currentBook]);


  // HTML/TAILWIND CSS | INDEX
  return (
    <div className="PARENT MAIN ROOT Component">

      {/* Title/Menu/HEADER */}
      <header 
        className={`
        fixed top-0 left-0 w-full z-50
        bg-gray-950 backdrop-blur-md
        transition-transform duration-300 ease-in-out
        ${headerVisible ? "translate-y-0" : "-translate-y-full"}
      `}>
        <div className="flex justify-between place-items-center py-2 px-1 md:py-2 md:px-5 w-full sm:w-full mx-auto">
          <h1 
            className="text-white cursor-pointer hidden md:flex md:text-2xl sm:text-lg" 
            onClick={() => {setCurrentBookId(null); setSelectedCharacter(null); }}
            >📖STORY ORGANIZER
          </h1>

          <p className="md:hidden flex items-center justify-center text-2xl">📖</p>

          <div className="flex gap-2">
            
            {/* SEARCH INPUT FIELD... IN PROGRESS */}
            <div className="hidden md:flex text-white bg-gray-950">   
                <label className="block text-sm font-medium text-heading sr-only ">Search</label>
                <div className="relative">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <svg 
                          className="w-4 h-4 text-gray-200"
                          fill="none" 
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor">
                            <path 
                            stroke="currentColor" 
                            d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                            />
                        </svg>
                    </div>
                    <input 
                    className="w-full px-0 mt-1 py-1 ps-9 border-b 
                      outline-none text-heading text-sm shadow-xs 
                      focus:border-gray-200
                      placeholder:text-body" 
                      placeholder="Search" 
                      required />
                </div>
            </div>

            {/* MOBILE ICON BUTTON */}
            <button
              onClick={() => setOpenSearch(true)}
              className="
                md:hidden
                flex items-center justify-center
                w-10 h-9 group
                border rounded
                text-white bg-gray-950 
                hover:bg-gray-200
                transition cursor-pointer
              "
            >
              <svg 
                  className="w-4 h-4 text-gray-200 group-hover:text-gray-950"
                  fill="none" 
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor">
                    <path 
                    stroke="currentColor"
                    d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    />
                </svg>
            </button>

            {/* MOBILE OVERLAY SEARCH */}
            {openSearch && (
              <div className="fixed top-0 left-0 w-full h-13 z-[60] bg-gray-950 px-4 flex items-center gap-3">
                <svg 
                  className="w-4 h-4 text-gray-200"
                  fill="none" 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor">
                    <path 
                    stroke="currentColor" 
                    d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    />
                </svg>

                <input
                  autoFocus
                  type="text"
                  placeholder="Search"
                  required
                  className="
                    flex-1 bg-transparent
                    border-0 border-b border-gray-600
                    px-0 py-1
                    text-sm text-gray-100
                    placeholder-gray-500
                    focus:outline-none focus:ring-0
                    focus:border-indigo-400
                  "
                />

                <button
                  onClick={() => setOpenSearch(false)}
                  className="text-gray-400 hover:text-gray-200 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div onClick={toggleTheme} className="border border-white text-gray-200 rounded hover:bg-gray-300 hover:text-gray-950 transition">
              <button className="hidden dark:block cursor-pointer">
              <span className="group inline-flex shrink-0 justify-center items-center size-8 stroke-2">
                <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              </span>
            </button>
            <button className="block dark:hidden cursor-pointer">
              <span className="group inline-flex shrink-0 justify-center items-center size-8 stroke-2">
                <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              </span>
            </button>
            </div>

            {/* EXPORT/IMPORT BUTTON */}
            <div className="relative group inline-block group">
              <button 
                title="IMPORT/EXPORT FILE"
                className="cursor-pointer p-1 transition border border-white text-gray-200 rounded hover:bg-gray-300 hover:text-gray-950 transition" 
                onClick={() => showModalFile(true)} > 
                <FontAwesomeIcon icon={faFileImport} size="xl" />
              </button>

              {/* TOOLTIP IN PROGRESS */}
              <div
                className="
                  top-full left-1/2 -translate-x-1/2 mt-2 z-50
                  hidden
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
      </header>
      
      {/* THEME BACKGROUND */}
      <div className={`relative min-h-screen w-full min-w-0 mx-auto px-4 transition-colors transition duration-500 bg-white text-black dark:bg-gray-800 dark:text-white backdrop-blur-lg overflow-x-hidden`}>
        {/* THEME BACKGROUND IMAGE STYLE */}
        <div className="fixed inset-0 bg-cover bg-center opacity-50 -z-10 transition-opacity duration-800"/>      
          {/* MAIN PAGE */}
          <div className="w-full max-w-4xl mx-auto min-h-screen pt-12">

            {/* BOOK LIST / HOMEPAGE */}
            {currentBookId === null && (
              // BOOK LIST PAGE
              <div className="p-3 my-3 rounded-2xl shadow-lg bg-gray-100 dark:bg-gray-900">
                
                <div className="py-4 flex gap-2">

                  <input
                  className="border-b-1 border-gray-200 px-1 w-full outline-none hover:border-gray-500 transition text-gray-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                  placeholder="New Book Title"
                  value={bookTitle}
                  onChange={e => setBookTitle(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === "Enter") addBook();
                    }}
                  title="Add new book"
                  />

                  <button 
                    onClick={addBook} 
                    title="Add book title"
                    className="cursor-pointer border-gray-200 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 p-1 transition dark:border-white dark:text-white"
                  >
                    <FontAwesomeIcon icon={faPlus} size="lg"/>
                  </button>

                    {/* Conditional "Successfully Added" message */}
                <div className="absolute mt-9">
                  {bookAdded && (
                    <span className="mt-2 text-sm text-green-600 font-semibold animate-pulse">
                      Book Successfully Added!
                    </span>
                  )}
                </div>
                  
                </div>

                {/* SHOW BOOK LIST */}
                {/* BOOK CARDS */}
                <h2 className="text-2xl font-semibold pb-2 text-gray-950 dark:text-white">My Books</h2>

                {!books.length && (
                  <div className="w-full flex justify-center items-center py-20 px-10"> 
                    <h1 className="text-3xl font-bold text-gray-400 text-center">
                      PLEASE ADD BOOKS HERE. INSTEAD OF JUST LETTING THEM GATHER DUST IN YOUR INSANE MIND...
                    </h1>
                  </div>
                )}
                
                <div className="grid grid-cols-2 px-15 sm:grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 pb-1 place-items-center">
                    {books.map(book => (
                    <div
                      key={book.id} 
                      draggable
                      onDragStart={handleDragStart}
                      data-id={book.id}
                      data-title={book.title}
                      onDragEnd={() => { setDraggingId(null); setIsDraggingBook(false);}}
                      onClick={() => selectBook(book.id!)}
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
            {currentBookId !== null && currentBook && selectedCharacter === null && (
                <div className="px-3 pt-3 my-3 rounded-2xl shadow-lg bg-gray-100 dark:bg-gray-900">
                  <div className="">
                    <button 
                      onClick={() => setCurrentBookId(null)} 
                    > <FontAwesomeIcon className="cursor-pointer hover:text-blue-500 transition hover:scale-105" icon={faArrowLeftLong} size="xl"/>
                    </button>
                  </div>
                
                  {/* Conditional "Changes Saved" message */}
                  <div className="absolute mt-8">
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
                        title="Edit book title..."
                        className="text-2xl w-full font-semibold border-b-1 border-gray-200 hover:border-gray-500 outline-none focus-ring-0 truncate" 
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onBlur={saveBookTitle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveBookTitle();
                        }}
                      />
                      
                    </div>

                    <button onClick={() => setShowAddCharacter(!showAddCharacter)} className="bg-black border border-black text-white text-xs md:text-base px-5 py-2 rounded-xl cursor-pointer hover:bg-gray-800 transition">
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
                        <input type="number" className="border p-2 w-full mb-2 rounded" placeholder="Volume" value={arcStage} onChange={e => setArcStage(e.target.value)} />
                        <button onClick={addCharacter} className="float-right bg-black border border-black text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-gray-800 transition">Confirm</button>
                      </div>
                  )}

                  {currentBook.characters.length === 0 && (
                  <div className="w-full flex justify-center items-center py-20"> 
                    <h1 className="text-3xl font-bold text-gray-400 text-center"> 
                      PLEASE ADD SOME CHARACTERS. IT GETS LONELY SOMETIMES HERE... 
                    </h1> 
                  </div>
                  )}

                  {/* Display Character Card Block */}
                  <div className="grid gap-4 pb-4 sm:grid-cols-2 md:grid-cols-4 items-stretch place-items-center">
                      {currentBook.characters.map(char => (

                      // CHARACTER CARDS w/ image... //
                      <div 
                      key={char.id} 
                      title="Open character sheet."
                      className="
                        h-[300px] w-full max-w-sm
                        cursor-pointer bg-white shadow-lg rounded-2xl
                        transition-all duration-300
                        hover:-translate-y-2 hover:shadow-2xl
                        group
                        flex flex-col
                        dark:bg-gray-950"
                      // onClick={() => openEditCharacter(char)}
                      onClick={() => openEditCharacter(char)}>

                          {/* IMAGE */}
                          <div className="h-60 w-full overflow-hidden rounded-t-xl">
                            <a href="#">
                                <img 
                                className="h-full w-full object-cover group-hover:scale-105 transition" 
                                src={imageMap[char.id] || char_image}
                                alt="Default Character Image" />
                            </a>
                          </div>

                          <div className="flex-1 p-2 text-center">
                              <a href="#">
                                  <h3 className="text-xl font-semibold tracking-tight line-clamp-1">{char.name}</h3>
                                  <p className="text-sm text-gray-400 mb-2 line-clamp-1">{char.role || "Character Role"}</p>
                                  <p className="text-sm text-gray-400 mb-2 line-clamp-1">*First Chapter Appearance</p>
                              </a>
                          </div>
                      </div>
                      ))}
                  </div>


                </div>
            )}

            {/* CHARACTER DATA PAGE / EDIT CHAR DETAILS */}
            {selectedCharacter !== null && editingCharacter && (
              <div className="rounded-2xl shadow-lg pt-3 my-3 bg-gray-100 dark:bg-gray-900">

                {/* Buttons */}
                <div className="flex justify-between pb-3 px-3">

                  <button 
                    onClick={() => {setSelectedCharacter(null), setcharEditing(false)}} 
                    > <FontAwesomeIcon className="cursor-pointer hover:text-blue-500 transition hover:scale-105" icon={faArrowLeftLong} size="xl"/>
                  </button>

                  <div className="space-x-2">
                    <button 
                      onClick={() => setShowGenImage(true)}
                      className="cursor-pointer border-gray-200 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 p-1 transition dark:border-white dark:text-white"
                    >
                      <FontAwesomeIcon icon={faPlus} size="lg"/>
                    </button>

                    <button 
                      onClick={() => deleteCharacter(editingCharacter.id) }
                      > <FontAwesomeIcon className="cursor-pointer hover:text-red-500 transition hover:scale-105" icon={faTrashCan} size="xl"/>
                    </button>

                      {charEditing && <FontAwesomeIcon icon={faSpinner} size="xl" spin />}
                      {!charEditing && <FontAwesomeIcon className="text-emerald-500" icon={faCheck} size="xl" />}
                  </div>

                </div>

                {/* CHARACTER CARD AND IMAGE FORMAT */}
                <div  
                className="space-y-2"
                onFocus={() => setcharEditing(true)}
                onChange={() => setonChange(true)}
                onBlur={updateCharacter}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLElement).blur();
                  }
                }}
                >

                  {/* IMAGE + BASIC INFO */}
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] rounded-t-lg bg-gray-50 dark:bg-gray-950">
                    
                    <div className="w-full h-50 sm:h-50 rounded-t-lg overflow-hidden p-1">
                      <img
                        src={imageMap[selectedCharacter] || char_image}
                        alt="Character Image"
                        className="w-full h-full object-cover rounded"
                      />
                    </div>

                    <div className="flex flex-col p-1">
                      <div className="">
                        <input 
                          className="w-full text-xl font-semibold outline-none focus:border-b hover:border-b"
                          value={editingCharacter.name} 
                          onChange={e => setEditingCharacter({ ...editingCharacter, name: e.target.value })
                          }
                          placeholder="Character Name"
                        />
                      </div>

                      <div className="">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                        <input 
                          placeholder="Add Character Role"
                          className="w-full pl-3 outline-none focus:border-b hover:border-b"
                          value={editingCharacter.role} 
                          onChange={e => setEditingCharacter({ ...editingCharacter, role: e.target.value })} 
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                        <textarea 
                        placeholder="Character Appearance/Personality"
                        rows={3} 
                        readOnly
                        value={"He is a little boy with an ugliness inside and out. He is super ugly that an image of him will shatter any eyes and mirrors there is. Be careful of this boy..."}
                        className="w-full resize-none pl-3 rounded-xl outline-width-1 hover:border" />
                      </div>
                    </div>
                  </div>

                  {/* CONTENT BELOW THE IMAGE CARD */}
                  <div className="pr-2 pl-2 pb-3 space-y-3"> 
                    {/* NOTES */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-500">
                        <label><span>📝</span> Character Notes</label>
                      </div>
                      <textarea 
                      rows={5} 
                      className="w-full rounded-xl pl-3 hover:border"
                      placeholder="Add Notes"
                      value={editingCharacter.notes} 
                      onChange={e => setEditingCharacter({ ...editingCharacter, notes: e.target.value })} />
                    </div>

                    {/* ABILITIES */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-500">
                        <span className="text-indigo-500">✨</span> Abilities
                      </div>
                      <input 
                        className="w-full outline-none focus:border-b pl-3 hover:border-b"
                        value={editingCharacter.abilitiesText} 
                        onChange={(e) => setEditingCharacter({ ...editingCharacter, abilitiesText: e.target.value })
                        }
                        placeholder="Add Abilities" />
                    </div>

                    {/* CHAPTER APPEARANCES */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-500">
                        <span className="text-indigo-500">📖</span> Chapter Appearances
                      </div>
                      <input 
                      placeholder="Chapter Appearances"
                      readOnly
                      className="w-full outline-none focus:border-b pl-3 hover:border-b"
                      value={"2, 3"} />
                    </div>   

                  </div>
                
                </div>

              </div>
            )}

          </div>
      </div>

            {/* GENERATE CHARACTER IMAGE BOOM */}
            {showGenImage && selectedCharacter && (
                <div className="fixed inset-0 flex items-center bg-black/50 z-50 overflow-auto" 
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                      showModal(false);
                      setImageUrl(null);
                    }
                  }}
                >
                  <div className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-100 max-h-screen overflow-y-auto p-6 rounded-xl shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
                    
                      <h2 className="text-2xl font-bold text-gray-800 pb-2">
                        Character Image Generator
                      </h2>

                      {/* Prompt Input */}
                      <div className="flex flex-col sm:flex-row gap-3 mb-3">
                        <input
                          type="text"
                          value={charprompt}
                          onChange={(e) => setcharPrompt(e.target.value)}
                          placeholder="e.g. A space pirate with a mechanical eye"
                          className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        <button
                          onClick={generateImage}
                          disabled={loading}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                          {loading ? "Generating..." : "Generate"}
                        </button>
                      </div>

                      {/* Error */}
                      {error && (
                        <div className="text-red-500 text-sm">
                          {error}
                        </div>
                      )}

                      {/* Image Preview */}
                      <div className="w-full flex justify-center">
                        <div className="w-72 h-96 bg-gray-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                          {loading && (
                            <div className="animate-pulse text-gray-400">
                              Generating image...Please wait
                            </div>
                          )}

                          {!loading && imageUrl && (
                            <img
                              src={imageUrl}
                              alt="Generated character"
                              className="w-full h-full object-cover"
                            />
                          )}

                          {!loading && !imageUrl && (
                            <div className="text-gray-400 text-sm">
                              Image will appear here
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-center pt-3">
                        <button 
                        className="py-2 px-6 rounded-xl bg-indigo-200 hover:bg-indigo-300 text-center cursor-pointer"
                        onClick={saveImage}>
                          Save
                        </button>
                      </div>

                  </div>
                </div>
            )}

            {/* EXPORT/IMPORT MODAL */}
            {showFileModal && (
                <div 
                className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" 
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                      showModalFile(false);
                    }
                  }}>
                  <div className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-100 max-h-[90vh] overflow-y-auto p-6 rounded-xl shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
                    
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
                                  <svg className="w-8 h-8 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/></svg>
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


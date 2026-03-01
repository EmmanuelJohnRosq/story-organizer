import { useState, useEffect, useCallback, useRef, use } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import UserPage from "./pages/UserPage";
import BookPage from "./pages/BookPage";
import CharacterPage from "./pages/CharacterPage";

import { db, type Book, type Character, type EditableCharacter, type Images, type Notes, type CharacterDescription } from "./db";

import { useDropzone } from "react-dropzone";
import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faFileImport, faTrashCan, faCheck, faArrowLeftLong, faSpinner, faPlus, faMinus, faGear } from "@fortawesome/free-solid-svg-icons";

type CharacterDetailTab = "overview" | "background" | "abilities" | "relationships" | "appearance";


export default function StoryOrganizer() {

  const [books, setBooks] = useState<Book[]>([]);
  const [character, setCharacters] = useState<Character[]>([]);
  const [images, setImages] = useState<Images[]>([]);
  const [userNotes, setUserNotes] = useState<Notes[]>([]);
  const [bookNotes, setBookNotes] = useState<Notes[]>([]);
  const [charNotes, setCharNotes] = useState<Notes[]>([]);

  // USER STATE
  const [mode, setMode] = useState("user"); // THREE MODE PAGES: user, book, & character

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

  const [activeCharacterTab, setActiveCharacterTab] = useState<CharacterDetailTab>("overview");
  const [showCharacterActions, setShowCharacterActions] = useState(false);
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState("all");
  const [openAppearanceSections, setOpenAppearanceSections] = useState<Record<string, boolean>>({
    basic: true,
    face: false,
    hair: false,
    body: false,
    extras: false,
  });

  // CHARACTER IMAGE GENERATION w/ PUTER.js
  const [charprompt, setcharPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageSaved, setImageSaved] = useState<string | null>(null);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  // CHARACTER UPLOAD IMAGE
  const [uploadCharImage, showUploadCharImage] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  // USER DRAGGIN STATE
  const [setDrag, setIsDragOver] = useState(false);
  const [isDraggingBook, setIsDraggingBook] = useState(false);
  
  const [openSearch, setOpenSearch] = useState(false);
  const [titleEditing, settitleEditing] = useState(false);

  const [darktheme, setDarkTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFile(acceptedFiles[0]); // triggers re-render
  }, []);

  // const { getRootProps, getInputProps, isDragActive } = useDropzone({
  //   onDrop,
  //   multiple: false,
  // });

  // BOOK DETAILS INITIALIZE
  const [bookTitle, setBookTitle] = useState("");
  const [bookSummary, setBookSummary] = useState("");
  const [bookVolume, setBookVolume] = useState<string>("0");
  const [bookTags, setBookTags] = useState("");
  const [bookGenre, setBookGenre] = useState("");
  const [bookChapterCount, setBookChapterCount] = useState(0);
  const [bookStatus, setBookStatus] = useState("ongoing"); // default

  // CHARACTER DETAILS INITIALIZE
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [abilities, setAbilities] = useState("");
  const [chapterAppearance, setChapterAppearance] = useState("");

  //NEW CHARACTER SCHEMA INITIALIZE
  const [charStatus, setCharStatus] = useState("unknown");
  const [charImportance, setCharImportance] = useState("unknown");
  const [charOccupation, setCharOccupation] = useState("");
  const [charFutureNotes, setCharFutureNotes] = useState("");
  const [charNetWorth, setCharNetWorth] = useState("");
  const [charPowerLevel, setCharPowerLevel] = useState("");

  // Arrays (comma-separated input)
  const [charTitles, setCharTitles] = useState(""); // input as string -> array on save
  const [charAbilities, setCharAbilities] = useState("");
  const [charPersonalityTraits, setCharPersonalityTraits] = useState("");
  const [charTags, setCharTags] = useState("");
  const [charSetRaces, setCharSetRaces] = useState("");
  const [charChapterAppearances, setCharChapterAppearances] = useState("");
  const [charCharacterArc, setcharCharacterArc] = useState("");

  const [charTraits, setCharTraits] = useState<string[]>([]);

  // Relationships (complex object)
const [charRelationships, setCharRelationships] = useState<
  { charId: number; type: string }[]
>([]);

// Description (nested object)
const [charDescription, setCharDescription] = useState<CharacterDescription>({
  basic: { age: "", race: "", gender: "" },
  face: { faceShape: "", eyeColor: "", eyeShape: "", noseShape: "", mouthSize: "" },
  hair: { hairColor: "", hairStyle: "" },
  body: { bodyType: "", height: "", skinTone: "" },
  extras: { distinguishingFeatures: "", accessories: "", clothingStyle: "" },
});

  // Description (nested object)
  const defaultcharDescription: CharacterDescription = {
    basic: { age: "", race: "", gender: "" },
    face: { faceShape: "", eyeColor: "", eyeShape: "", noseShape: "", mouthSize: "" },
    hair: { hairColor: "", hairStyle: "" },
    body: { bodyType: "", height: "", skinTone: "" },
    extras: { distinguishingFeatures: "", accessories: "", clothingStyle: "" },
  };

  const currentBook = books.find(book => book.id === currentBookId);

  const characterDetailTabs: { key: CharacterDetailTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "background", label: "Background" },
    { key: "abilities", label: "Abilities" },
    { key: "relationships", label: "Relationships" },
    { key: "appearance", label: "Appearance" },
  ];

  // FUNCTION ON START - CONNETION TO DB
  const loadBooks = async () => {
    const allBooks = await db.books.toArray();
    allBooks.sort((a, b) => a.createdAt - b.createdAt);
    setBooks(allBooks);
  };

  const loadChars = async (bookId : string) => {
    const characters = await db.characters
      .where("bookId")
      .equals(bookId)
      .toArray();

    characters.sort((a, b) => a.id - b.id);
    setCharacters(characters);
    loadImages(characters);
  };

  // FILTERS USER NOTES FOR USER PAGE
  const loadUserNotes = async () => {
    const notes = await db.notes
      .where("bookId")
      .equals("")
      .toArray();

    notes.sort((a, b) => b.createdAt - a.createdAt);
    setUserNotes(notes);
  };

  // FILTERS USER NOTES FOR BOOK PAGE
  const loadBookNotes = async (bookId: string) => {
    const notes = await db.notes
      .where("bookId")
      .equals(bookId)
      .filter(note => note.charId == null)
      .toArray();

    notes.sort((a, b) => b.createdAt - a.createdAt);
    setBookNotes(notes);
  };

  // FILTERS USER NOTES FOR CHARACTER PAGE
  const loadCharNotes = async (charId: number) => {
    const notes = await db.notes
      .where("charId")
      .equals(charId)
      .toArray();

    notes.sort((a, b) => b.createdAt - a.createdAt);
    setCharNotes(notes);
  };

  // LOAD BOOKS ONCE WHEN WEB APP STARTS
  useEffect(() => {
    loadBooks();
    loadUserNotes();
  }, []);

  // Call db data when changes happen to currenBookId and selected character
  useEffect(() => {
    if (mode === "user") {
      setCharDescription({ ...defaultcharDescription });
    }
    if (mode === "book" && currentBookId) {
      loadBookNotes(currentBookId); 
      loadChars(currentBookId);
      setCharDescription({ ...defaultcharDescription });
    }

    if (mode === "character" && selectedCharacter) {
      loadCharNotes(selectedCharacter);
    }

  }, [currentBookId, selectedCharacter]);

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
      notes: char.notes.replace(/[^\S\r\n]+/g, " "),
      chapters: normalizeWhitespace(char.chapters),
      abilities: char.abilitiesText
        .split(",")
        .map(a => normalizeWhitespace(a),)
        .filter(a => a.length > 0) // removes empty ones
    };
  }

// Convert blob to base64 for image
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

    const allNotes = await db.notes.toArray();

    const data = {
      app: "story-organizer",
      version: "3.0",
      exportedAt: new Date().toISOString(),
      books,
      character,
      images: imagesWithBase64,
      allNotes,
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
      await db.notes.clear();
      await db.characters.clear();

      // Restore data from json
      await db.books.bulkAdd(parsed.books);
      await db.notes.bulkAdd(parsed.allNotes);
      await db.characters.bulkAdd(parsed.characters);

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
      loadUserNotes();

      alert("Import successful!");
      setCurrentBookId(null);
    } catch (err) {
      console.error(err);
      alert("Invalid file format");
    }

    showModalFile(false);
    setCurrentBookId(null);
    setSelectedCharacter(null);
  };

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
      summary: bookSummary,
      volume: Number(bookVolume) || 0,
      createdAt: Date.now(),
      tags: bookTags.split(",").map(a => normalizeWhitespace(a)),
      genre: bookGenre.split(",").map(a => normalizeWhitespace(a)),
      chapterCount: bookChapterCount,
      status: bookStatus,
    };

    // add new book to IndexedDB
    const id = await db.books.add(newBook);

    // Update React state: call set state, get prev array => assign new array, put the previous arrays/data, and new book data...
    setBooks(prev => [...prev, { ...newBook, id }]);

    // UI stuff
    setAlert("Book Added");
    setStatePopup(true);
    setBookTitle("");
    setBookVolume("");
    setBookSummary("");
    setBookAdded(true);
    setTimeout(() => {setBookAdded(false); setStatePopup(false); setAlert("");}, 2000);
  }

  // select book element
  function selectBook(id: string) {
    setCurrentBookId(id);
    setShowAddCharacter(false);
    setMode("book");
    setDraftNote(null);
  }

  // The main function that accepts a string and returns a processed array
  const stringToArray = (inputString: string) => {
    if (typeof inputString !== 'string') {
      return [];
    }
    return inputString.split(",").map(a => normalizeWhitespace(a));
  };

  // UPDATE BOOK DETAILS
  async function updateBookDetails( bookId: string, updatedSummary: string, updatedVolume: number, updatedGenre: string) {
    // if (updatedSummary.trim() === currentBook?.summary && updatedVolume === currentBook?.volume) return;
    try {
      await db.books.update(bookId, {
        summary: updatedSummary,
        volume: updatedVolume,
        genre: stringToArray(updatedGenre),
      });

      // Update React state immediately (no reload needed)
      setBooks(prev =>
        prev.map(book =>
          book.id === bookId
            ? { ...book, summary: updatedSummary, volume: updatedVolume, genre: stringToArray(updatedGenre), }
            : book
        )
      );

      setAlert("Changes Saved")
      setStatePopup(true);
      setTimeout(() => {setStatePopup(false); setAlert("");}, 2000);

    } catch (error) {
      console.error("Failed to update book:", error);
    }
  }

  async function updateBook(id: string, editedSummary:string, editedVolume: number, editedGenre: string) {
    if (editedSummary.trim() === currentBook?.summary && editedVolume === currentBook?.volume) return;

    await updateBookDetails( id, editedSummary, editedVolume, editedGenre);
  }

  // CREATING CHARACTER DATA OF MORPH
  const [charDescription1, setCharDescription1] = useState<CharacterDescription>({
      basic: { age: "18", race: "Human", gender: "Male" },
      face: { faceShape: "Oval", eyeColor: "Silver", eyeShape: "Narrow", noseShape: "Straight", mouthSize: "Medium" },
      hair: { hairColor: "Black", hairStyle: "Messy" },
      body: { bodyType: "Athletic", height: "Tall", skinTone: "Fair" },
      extras: { distinguishingFeatures: "", accessories: "One Silver Dot Earrings", clothingStyle: "Traveler" },
  });

  // create new character to save to db
  async function addCharacter() {
    if (!name || currentBookId === null) return;

    const newCharacter: Character = {
      id: Date.now(),
      bookId: currentBookId,
      name: normalizeWhitespace(name),
      role: normalizeWhitespace(role),
      notes: notes.trim().replace(/[^\S\r\n]+/g, " "),
      abilities: abilities.split(",").map(a => normalizeWhitespace(a)),
      chapters: normalizeWhitespace(chapterAppearance),
      status: normalizeWhitespace(charStatus),
      importance: normalizeWhitespace(charImportance),
      occupation: normalizeWhitespace(charOccupation),
      futureNotes: charFutureNotes,
      characterArc: charCharacterArc,
      netWorth: charNetWorth,
      powerLevel: normalizeWhitespace(charPowerLevel),
      titles: charTitles.split(",").map(a => normalizeWhitespace(a)),
      personalityTraits: charPersonalityTraits.split(",").map(a => normalizeWhitespace(a)),
      tags: charTags.split(",").map(a => normalizeWhitespace(a)),
      setRace: charSetRaces.split(",").map(a => normalizeWhitespace(a)),
      chapterAppearances: charChapterAppearances.split(",").map(a => normalizeWhitespace(a)),
      relationships: charRelationships,
      description: charDescription,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.characters.add(newCharacter);

    setCharacters(prev => [...prev, newCharacter]);

    setAlert("Character Successfully Created");
    setStatePopup(true);

    setName("");
    setRole("");
    setNotes("");
    setAbilities("");
    setChapterAppearance("");
     setCharStatus("unknown");
    setCharImportance("unknown");
    setCharOccupation("");
    setCharFutureNotes("");
    setCharNetWorth("");
    setCharPowerLevel("");

    setCharTitles("");
    setCharAbilities("");
    setCharPersonalityTraits("");
    setCharTags("");
    setCharChapterAppearances("");
    setcharCharacterArc("");

    setCharSetRaces("");
    setCharRelationships([]);

    setCharDescription({ ...defaultcharDescription });

    setShowAddCharacter(false);

    setTimeout(() => {setStatePopup(false); setAlert("");}, 2000);
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

    // THIS DELETES USING PRIMARY KEY/CHARACTER ID
    await db.characters.delete(characterId);

    setCharacters(prev => // Calls back the previous array inside setCharacters
      prev.filter( //THIS CREATES A NEW ARRAY
        c => c.id !== characterId)); // CONDITION TO KEEP ALL CHARACTERS THAT DOES NOT MATCH THE characterId

    setSelectedCharacter(null);
  }

  // CREATING CHARACTER DATA OF MORPH
    // const newCharacter1: Character = {
    //   id: selectedCharacter!,
    //   bookId: currentBookId!,
    //   name: "Morpheus",
    //   role: "Protagonist",
    //   notes: "Morph is a normal young man transmigrated in a game like fantasy world after dying from a large meteorite that might also cause Earth it's destruction.",
    //   abilities: ["Perfect Shapeshift", "Mimic", "Memory Eater", "Origins Blood"],
    //   chapters: "1",
    //   status: "Alive",
    //   importance: "Main Character",
    //   occupation: "Territory Lord",
    //   futureNotes: "He becomes the conqueror of the Kingdom...",
    //   characterArc: "At first, Morph is new to the fantasy stuff, then after one year surviving without the system. He knew that he had to do his best to survive.",
    //   netWorth: "150 gold",
    //   powerLevel: "Tier 1: Human Level",
    //   titles: ['Lord Morpheus', 'The Primorph', 'Baron', 'Lord Everform'],
    //   personalityTraits: ['Observant', 'Calculated', 'Careful planner', 'Cautious', 'Deadpan', 'Aloof', 'Defiant', 'Adaptive', 'Perceptive', 'Transparent', 'Wary','Ruminative','Guarded'],
    //   tags: ['Male', 'Commoner', 'Lord', 'Planner', 'Protagonist', 'Chaotic Neutral', 'Stealthy', 'Hidden Power'], //tags or alignment
    //   setRace: ['Human','Doppelganger', 'Everform','God of Origins'],
    //   chapterAppearances: ['1','2','3','4','5','6','7','8','9','10'],
    //   relationships: 
    //     [
    //       { 
    //         charId: 1771166152670,
    //         type: "Friend/Brother-like",
    //       },
    //       {
    //         charId: 1771166945604,
    //         type: "Loyal Subordinate",
    //       },
    //       {
    //         charId: 1771503708024,
    //         type: "Pet",
    //       },
    //       {
    //         charId: 1771503971863,
    //         type: "Subordinate",
    //       },
    //     ],
    //   description: charDescription1,
    //   createdAt: originalCharacter?.createdAt!,
    //   updatedAt: Date.now(),
    // };

  // open edit Char Modal
  function openEditCharacter(characters: Character) {

    setMode("character");
    setDraftNote(null);
    showUploadCharImage(true);

    const selectedCharacter = { ...characters, abilitiesText: characters.abilities.join(", ")
    } as Character & { abilitiesText : string };
    
    setEditingCharacter({ ...selectedCharacter });

    setOriginalCharacter({ ...selectedCharacter });

    setSelectedCharacter(characters.id);
    setActiveCharacterTab("overview");
    setShowCharacterActions(false);
    setRelationshipTypeFilter("all");
    setOpenAppearanceSections({
      basic: true,
      face: false,
      hair: false,
      body: false,
      extras: false,
    });
  }

  async function openCharacterById(charId: number) {
    const localCharacter = character.find(char => char.id === charId);
    if (localCharacter) {
      openEditCharacter(localCharacter);
      return;
    }

    const dbCharacter = await db.characters.get(charId);
    if (dbCharacter) {
      openEditCharacter(dbCharacter);
    }
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

    const updatedChars = [...character.map(c =>
        c.id === cleanedCharacter.id ? updatedCharacter : c
      )
    ];
      
    await db.characters.update(cleanedCharacter.id, updatedCharacter);

      // Update React state immediately (no reload needed)
    setCharacters(updatedChars);
    
    setonChange(false);

    setAlert("Changes Saved");
    setStatePopup(true)

    setTimeout(() => {setStatePopup(false); setAlert("");}, 2000);
    
    setOriginalCharacter({...cleanedCharacter});
    setEditingCharacter({ ...editableVersion });
  }

  // BOOK TITLE CHANGES - CHANGEABLE INPUT DATA
  useEffect(() => {
    if (currentBook) {
      setTitleDraft(currentBook.title);
      setBookSummary(currentBook.summary);
      setBookGenre((currentBook.genre ?? []).join(", "));
      setBookVolume(String(currentBook.volume));
    }
  }, [currentBook]);

  // SAVE BOOK TITLE on DB when called
  async function saveBookTitle() {
    if (!titleDraft.trim() || titleDraft.trim() === currentBook?.title) {
      setTitleDraft(currentBook!.title); //Revert to previous title
      setSavedTitle(false);
      settitleEditing(false);
      return;
    }

    const titleUpdate = { title: normalizeWhitespace(titleDraft)};

    await db.books.update(currentBookId, titleUpdate);


    setBooks(prev => prev.map(book => book.id === currentBookId ? {...book, title: titleDraft.trim().replace(/\s+/g, " ")} : book));

    setSavedTitle(true);
    setAlert("Changes Saved");
    setStatePopup(true);
    settitleEditing(true);
    setTimeout(() => {setSavedTitle(false), settitleEditing(false), setStatePopup(false), setAlert("");}, 2000);
  }

  // DEFAULT CHAR IMAGE FORMAT
  const [char_image] = useState("/textures/char_images/default_char.jpg")
  
  // DARK MODE USE EFFECT
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

  // CALL WHEN USER UPLOADED IMAGE
  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setPreviewUrl(objectUrl);
    }
  },[imageFile]);

  function hydrateDescription(
    description?: CharacterDescription
  ): CharacterDescription {
    return {
      basic: {
        age: description?.basic?.age ?? "",
        race: description?.basic?.race ?? "",
        gender: description?.basic?.gender ?? "",
      },
      face: {
        faceShape: description?.face?.faceShape ?? "",
        eyeColor: description?.face?.eyeColor ?? "",
        eyeShape: description?.face?.eyeShape ?? "",
        noseShape: description?.face?.noseShape ?? "",
        mouthSize: description?.face?.mouthSize ?? "",
      },
      hair: {
        hairColor: description?.hair?.hairColor ?? "",
        hairStyle: description?.hair?.hairStyle ?? "",
      },
      body: {
        bodyType: description?.body?.bodyType ?? "",
        height: description?.body?.height ?? "",
        skinTone: description?.body?.skinTone ?? "",
      },
      extras: {
        distinguishingFeatures: description?.extras?.distinguishingFeatures ?? "",
        accessories: description?.extras?.accessories ?? "",
        clothingStyle: description?.extras?.clothingStyle ?? "",
      }
    };
  }

  useEffect(() => {
    if (!originalCharacter) return;
    setCharDescription(hydrateDescription(originalCharacter.description));
    setCharTraits(originalCharacter.personalityTraits);
  }, [originalCharacter]);

  const traits = [
    `${charDescription.basic.age}-year-old`,
    charDescription.basic.race,
    charDescription.basic.gender,
    charDescription.body.height && `${charDescription.body.height} height`,
    charDescription.body.bodyType && `${charDescription.body.bodyType} build`,
    charDescription.body.skinTone && `${charDescription.body.skinTone} skin`,
    charDescription.face.faceShape && `${charDescription.face.faceShape} face`,
    charDescription.face.eyeShape && `${charDescription.face.eyeShape} ${charDescription.face.eyeColor} eyes`,
    charDescription.hair.hairColor && `${charDescription.hair.hairColor} hair`,
    charDescription.hair.hairStyle,
    charDescription.extras.accessories,
    charDescription.extras.clothingStyle && `wearing ${charDescription.extras.clothingStyle} style clothing`,
    charTraits.length > 0 && `expression reflecting ${
    Array.isArray(charTraits)
    ? charTraits.join(", ")
    : charTraits
    } personality`
    ].filter(Boolean);

  useEffect(() => {
    setcharPrompt(traits.join(", "));
  },[showGenImage]);

  // IMAGE GENERATION - PUTER.JS
  const generateImage = async () => {
    if(!charprompt) return;
    setLoading(true);
    setError("");

    try {
      const enhancedPrompt = 
      `close portrait shot, shoulder up,${charprompt},looking at camera,fantasy anime art style, solid color background, centered composition, soft lighting`;

      // Use the puter.ai.txt2img function to generate an image
      const image = await puter.ai.txt2img(enhancedPrompt , {
        model: "gpt-image-1.5", // best
        // model: "gpt-image-1", // not working
        // model: "black-forest-labs/FLUX.1.1-pro", // good
        // model: "dall-e-3", // okay/super fucking expensive
        // model: "black-forest-labs/FLUX.1-schnell", // kinda okay/ cheap
        // model: "gemini-2.5-flash-image-preview", // this is shit
        // model: "grok-image", // not fucking working
      });

      // Validate that it is actually an image
      // const src = image?.src;
      // if (!src || typeof src !== "string" || (!src.startsWith("data:image/") && !src.startsWith("http") && !src.startsWith("data:text/xml"))) {
      //   console.error("Invalid image response:", src);
      //   setImageUrl(null);
      //   setImageSaved(null);
      //   throw new Error("Image generation failed: Not a valid image.");
      // }

      setImageUrl(image.src); // Puter returns an HTMLImageElement
      setImageSaved(image.src);
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error(err);
      
      // setImageUrl(null);
      setImageSaved(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Checking for my puter account usage
  async function checkimageUsage() {
    console.log("image file: ", imageSaved ? (imageSaved!.split(",")[0]) : "No imagefile");
    const month = puter.auth.getMonthlyUsage()
    const appid = puter.auth.getDetailedAppUsage('app-907541aa-7512-568b-af67-9f6b383a53ca')
    
    console.log("appID", appid);
    console.log("motht", month);
  }

  // CONVERT UPLOADED IMAGE TO AN HTML IMAGE ELEMENT TO DISPLAY
  async function convertUploadedImage(imageFile: any) {
    if (!imageFile) return;

    // Initialize FileReader function
    const reader = new FileReader();

    reader.onload = () => {
    const base64Image = reader.result;

    if (typeof base64Image === "string") {
      console.log("Converted image:", base64Image);

      // Call saveImage to save to db.
      saveImage(base64Image);
    }
  };

    // Convert the uploaded image to an html Image element/base64
    reader.readAsDataURL(imageFile); 
  }

  // SAVE IMAGE INSIDE DB
  async function saveImage(imageFile: any) {
    if (!imageFile) return;

     // 1️⃣ Convert image URL to Blob
    const response = await fetch(imageFile);
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
    setImageSaved(null);
    setImageFile(null);
    setPreviewUrl(null);

    //PROMPT: A young man, 18 years old. Black and white hair, sharp golden eyes, chiseled face. quite cold and handsome.

  }

  // LOAD IMAGES IN DB, fetch and put on a setState for display
  const loadImages = async (chars: any) => {
    if (!chars.length) return;

    const charIds = chars.map((c: { id: any; }) => c.id);

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


  // COLOR PICKER
  const stickyColors = [
    "yellow",
    "pink",
    "green",
    "sky",
    "purple",
    "gray",
  ];

  // COLOR MAP FOR RANDOM COLOR ASSIGNMENT OF NOTES
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-200 dark:bg-yellow-800",
    pink: "bg-pink-200 dark:bg-pink-800",
    green: "bg-green-200 dark:bg-green-800",
    sky: "bg-sky-200 dark:bg-sky-800",
    purple: "bg-purple-200 dark:bg-purple-800",
    gray: "bg-gray-200 dark:bg-gray-900"
  };
    
  const notesSubject = "";
  const notesContent = "";

  // DRAFT NOTE/ Blank note for adding new notes
  const [draftNote, setDraftNote] = useState<Notes | null>(null);
  const [draftNoteState, setDraftstate] = useState(false);

  async function addDraftNotes() {
    if (draftNote) return;
    
    const randomColor =
      stickyColors[Math.floor(Math.random() * stickyColors.length)];

    const newNotes = {
        notesId: crypto.randomUUID(),
        subject: notesSubject,
        content: notesContent,
        createdAt: Date.now(),
        color: randomColor,
        isDraft: true,
        bookId: currentBookId ? currentBookId : "",
        charId: selectedCharacter ? selectedCharacter : null,
      };

    // Update React state
    setDraftNote(newNotes);
    setDraftstate(true);
  }

  // SAVE NOTE AFTER UPDATING DRAFT NOTE TO DB
  async function saveNote(note: any) {
    if (!note.content.trim()) return;

    // GOES HERE IF THE NOTE IS A NEW NOTE
    if (note.isDraft) {
      // first time saving
      const { isDraft, ...noteData } = note;

      const dbId = await db.notes.add(noteData);

      if (mode === "user") {
        setUserNotes(prev => [
          { ...noteData, id: dbId }, ...prev
        ]);
      }

      else if (mode === "book") {
        setBookNotes(prev => [
          { ...noteData, id: dbId }, ...prev
        ]);
      }
      else if (mode === "character") {
        setCharNotes(prev => [
          { ...noteData, id: dbId }, ...prev
        ]);
      }

      setDraftNote(null);
      setDraftstate(false);
      setHideSave(false);
    } else {
      // update existing note
      await db.notes.update(note.id, {
        content: note.content,
      });

      setAlert("Changes Saved");
      setStatePopup(true);
      setHideSave(false);
      setTimeout(() => {
        setStatePopup(false);
        setAlert("");
      }, 2000);
    }
  }

  const [Addnewbooks, setAddnewBooks] = useState(false);
  const [notesShowState, setNotesShowState] = useState(true);
  const [addCharacterState, setAddCharState] = useState(true);

  // SHOW/HIDE CREATE NEW BOOK FORM
  const addBooksState = () => {
      setAddnewBooks(!Addnewbooks);
      setAddCharState(true);
  };

  // SHOW/HIDE ADD CHARACTER FORM
  const addNewcharacter = () => {
      setAddCharState(!addCharacterState);
      setAddnewBooks(true);
  };

  // SHOW/HIDE NOTES DISPLAY
  const displayNotes = () => {
    setNotesShowState(!notesShowState);
  };

  const [hideSave, setHideSave] = useState(false);
  // const [notSaved, setNotSaved] = useState(false);
  const [onFocusId, setOnFocusId] = useState("");
  const [noteContent ,setNoteContent] = useState("");

  // MATCHES THE SIZE OF THE CONTENT INSIDE THE NOTE
  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  // CREATING NEW NOTES WILL FOCUS AND SCROLL
  const draftTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // INTERACTION WITH THE TEXT AREA AND NOTES
  useEffect(() => {
    if (draftNote && draftTextareaRef.current) {
      draftTextareaRef.current?.focus({ 
        preventScroll: true 
      });
      draftTextareaRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [draftNote]);

  // POP UP VARIABLES
  const [showUndoPopup, setShowUndoPopup] = useState(false);
  const [showStatePopup, setStatePopup] = useState(false);
  const [alertMessage, setAlert] = useState("");

  const [deletedNote, setDeletedNote] = useState<Notes | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Notes | null>(null);
  const deleteTimeoutRef = useRef<number | null>(null);

  // DELETE NOTES/DRAFT
  // DELETE NOTES
  async function deleteNotes(id: number) {
    if(!id) return;
    
    await db.notes.delete(id);
  }

  function handleDeleteNote(note: Notes) {
    if (draftNote && note.id === draftNote.id) {
      setNoteToDelete(null)
      setDraftNote(null);
      
    } else {
      // Save to temporary deleted state
      setDeletedNote(note);
      
      setNoteToDelete(null);
      // Show undo popup
      setShowUndoPopup(true);

      // Remove from UI immediately
      if (mode === "user") {
        setUserNotes(prev => prev.filter(notes => notes.id !== note.id));
      }
      else if (mode === "book") {
        setBookNotes(prev => prev.filter(notes => notes.id !== note.id));
      }
      else if (mode === "character") {
        setCharNotes(prev => prev.filter(notes => notes.id !== note.id));
      }
      
      // Clear any previous timeout (important if deleting fast)
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }

      deleteTimeoutRef.current = window.setTimeout(() => {
        deleteNotes(note.id!);
        setDeletedNote(null);
        setShowUndoPopup(false);
        deleteTimeoutRef.current = null;
      }, 2000);
    }
  }

  function handleUndo() {
    if (!deletedNote) return;

    // Restore note
    if (mode === "user") {
      setUserNotes(prev => [deletedNote!, ...prev]);
    }
    else if (mode === "book") {
      setBookNotes(prev => [deletedNote!, ...prev]);
    }
    else if (mode === "character") {
      setCharNotes(prev => [deletedNote!, ...prev]);
    }

    // Cancel scheduled deletion
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }

    // Hide popup
    setShowUndoPopup(false);

    // Cancel the permanent deletion
    setDeletedNote(null);
  }

  // PAGINATION ON CHARACTTER CARDS DISPLAY
  const [currentPage, setCurrentPage] = useState(1);

  const charactersPerPage = 12;

  const indexOfLastChar = currentPage * charactersPerPage;
  const indexOfFirstChar = indexOfLastChar - charactersPerPage;

  const currentCharacters = character.slice(
    indexOfFirstChar,
    indexOfLastChar
  );

  const totalPages = Math.ceil(character.length / charactersPerPage);

  const pageWindow = 3; // how many page numbers to show

  const getPageNumbers = () => {
    const pages = [];

    let startPage = Math.max(
      1,
      currentPage - Math.floor(pageWindow / 2)
    );

    let endPage = startPage + pageWindow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - pageWindow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [currentBookId]);

  const upcaseLetter = (word: string) => {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  async function openCharacterRel(id: any) {
    const relatedCharacter = character.find(char => char.id === id);
    
    if (relatedCharacter) {
      openEditCharacter(relatedCharacter);
    } else {
      setSelectedCharacter(id);
    }
  }

// SCROLL BEHAVIOR AFTER CHANGES PAGES
// useEffect(() => {
//   window.scrollTo({behavior: "smooth" });
// }, [currentPage]);

  // HTML/TAILWIND CSS | INDEX
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
          path="book/:currentBookId/:selectedCharacterId"
          element={<CharacterPage />}
        />
      </Route>
    </Routes>
  );
}


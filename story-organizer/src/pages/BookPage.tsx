import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback, useRef, use } from "react";

import { db, type Book, type Character, type EditableCharacter, type Notes, type CharacterDescription } from "../db";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faCheck, faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

export default function BookPage() {
  const { currentBookId } = useParams();
  const navigate = useNavigate();

  // DO THIS IN PAGE START
    useEffect(() => { 
    const loadBook = async () => {
        if (!currentBookId) {
        navigate("/", { replace: true });
        return;
        }

        const book = await db.books.get(currentBookId);

        if (!book) {
        // Invalid ID → redirect
        navigate("/", { replace: true });
        return;
        }

        setCurrentBook(book);
        loadBookNotes(currentBookId); 
        loadChars(currentBookId);
    };

    loadBook();
    setCharDescription({ ...defaultcharDescription });
    setCurrentPage(1);
    }, [currentBookId]);

    const [character, setCharacters] = useState<Character[]>([]);
    const [bookNotes, setBookNotes] = useState<Notes[]>([]);

    const [currentBook, setCurrentBook] = useState<Book | null>(null);
  
    // Constant Variable
    const [showAddCharacter, setShowAddCharacter] = useState(false);
  
    // CHARACTER DATA
    const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
    const [editingCharacter, setEditingCharacter] = useState<EditableCharacter | null>(null);
    const [originalCharacter, setOriginalCharacter] = useState<Character | null>(null);
  
    // CHARACTER IMAGE GENERATION w/ PUTER.js
    const [imageMap, setImageMap] = useState<Record<string, string>>({});
  
    // EDITING OF BOOK TITLE
    const [titleDraft, setTitleDraft] = useState("");
    const [savedTitle, setSavedTitle] = useState(false);
    const [titleEditing, settitleEditing] = useState(false);
  
    // BOOK DETAILS
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
  
    // FUNCTION ON START - CONNETION TO DB
    const loadChars = async (bookId : string) => {
      const characters = await db.characters
        .where("bookId")
        .equals(bookId)
        .toArray();
  
      characters.sort((a, b) => a.id - b.id);
      setCharacters(characters);
      loadImages(characters);
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
  
    // DELETE BOOK
    async function deleteBook(id: string) {
      if(!id) return;
      
      await db.books.delete(id);

      navigate("/");
    }
  
    // The main function that accepts a string and returns a processed array
    const stringToArray = (inputString: string) => {
      if (typeof inputString !== 'string') {
        return [];
      }
      return inputString.split(",").map(a => normalizeWhitespace(a));
    };
  
    // UPDATE BOOK DETAILS / MAKE a button for saving book details...
    async function updateBookDetails( bookId: string, updatedSummary: string, updatedVolume: number, updatedGenre: string) {
      // if (updatedSummary.trim() === currentBook?.summary && updatedVolume === currentBook?.volume) return;
      try {
        await db.books.update(bookId, {
          summary: updatedSummary,
          volume: updatedVolume,
          genre: stringToArray(updatedGenre),
        });
  
        // Update React state immediately (no reload needed)
        setCurrentBook(prev => prev ? 
            {
                ...prev,
                summary: updatedSummary,
                volume: updatedVolume,
                genre: stringToArray(updatedGenre),
            }
            : null
        );
  
        setAlert("Changes Saved")
        setStatePopup(true);
        setTimeout(() => {setStatePopup(false); setAlert("");}, 2000);
  
      } catch (error) {
        console.error("Failed to update book:", error);
      }
    }
  
    // create new character to save to db
    async function addCharacter() {
      if (!name || currentBookId === undefined) return;
  
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
  
    // navigate to character page
    function openEditCharacter(characters: Character) {
  
      setDraftNote(null);
  
      const selectedCharacter = { ...characters, abilitiesText: characters.abilities.join(", ")
      } as Character & { abilitiesText : string };
      
      setEditingCharacter({ ...selectedCharacter });
  
      setOriginalCharacter({ ...selectedCharacter });

      navigate(`/book/${currentBookId}/${characters.id}`);
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
  
    //   setBooks(prev => prev.map(book => book.id === currentBookId ? {...book, title: titleDraft.trim().replace(/\s+/g, " ")} : book));
    //   CHANGE THIS TO ONLY UPDATE THE CURRENT BOOK IN THE VARIABLE SET STATE
  
      setSavedTitle(true);
      setAlert("Changes Saved");
      setStatePopup(true);
      settitleEditing(true);
      setTimeout(() => {setSavedTitle(false), settitleEditing(false), setStatePopup(false), setAlert("");}, 2000);
    }
  
    // DEFAULT CHAR IMAGE FORMAT
    const [char_image] = useState("/textures/char_images/default_char.jpg")

  
    // LOAD IMAGES FROM DB, fetch and put on a setState for display
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

        setBookNotes(prev => [
            { ...noteData, id: dbId }, ...prev
          ]);
  
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
        setBookNotes(prev => prev.filter(notes => notes.id !== note.id));
        
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
      setBookNotes(prev => [deletedNote!, ...prev]);
  
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
    }
  
    const upcaseLetter = (word: string) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1);
    }

  return (
    // MAIN PARENT CONTAINER DIV CLOSER
    <div className="w-full mx-auto flex justify-center gap-2 pt-15">
    
        {/* LEFT SIDE CONTAINER */}
        <div className="hidden xs:block flex-1 relative">

            {/* BOOK AND CHARACTER FORMS LEFT PANEL */}
            <div className="sticky top-15 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">

                {/* BOOK SUMMARY TITLE */}
                <div className="flex-1 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900 mb-2 p-3 flex justify-between transition duration-300">

                <h3 className="text-2xl font-semibold" onClick={() => console.log(currentBookId,currentBook)}>Book Details</h3>

                <div className="flex justify-center">
                    <button 
                    value={bookTitle}
                    className="border-gray-500 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 px-2 dark:border-white dark:text-white"
                    onClick={addBooksState}>
                        {Addnewbooks ? <FontAwesomeIcon icon={faPlus} size="xs" className="transition duration-500"/> : <FontAwesomeIcon icon={faMinus} size="xs"/>}
                    </button>
                </div>

                </div>

                {/* BOOK SUMMARY FORM */}
                {!Addnewbooks && (
                
                // BOOK DETAILS
                <div className="flex-1 rounded-md shadow-lg p-3 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300 animate-fadeDown">
                <form className="space-y-2">

                    {/* Summary */}
                    <div>
                    <label className="block text-xs mb-1">
                        Summary / Synopsis
                    </label>
                    <textarea
                        rows={8}
                        className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600 text-area-scroll"
                        placeholder="Update book summary"
                        value={bookSummary}
                        onFocus={(e) => autoResize(e)}
                        onBlur={(e) => { e.currentTarget.style.height = "auto";}}
                        onChange={e => setBookSummary(e.target.value)}
                    />
                    </div>

                    {/* SAMPLE GENRE */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                    Book Genre
                    </label>
                    <input
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
                    placeholder="Enter genre separated by comma"
                    value={bookGenre}
                    onChange={e => setBookGenre(e.target.value)}
                    />
                </div>

                    {/* Current Volume */}
                    <div>
                    <label className="block text-xs font-medium mb-1">
                        Current Volume
                    </label>
                    <input
                        type="number"
                        className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
                        value={bookVolume}
                        placeholder="Update current book volume"
                        onChange={e => setBookVolume(String (e.target.value))}
                    />
                    </div>

                    <button
                    type="button"
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                    onClick={() => {updateBookDetails(currentBook!.id, bookSummary, Number(bookVolume), bookGenre)}}
                    >
                    SAVE
                    </button>
                </form>
                </div>

                )}


                {/* ADD CHARACTER TITLE  */}
                <div className="flex-1 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900 mb-2 p-3 flex justify-between transition duration-300">

                <h3 className="text-2xl font-semibold">Add Character</h3>

                <div className="flex justify-center">
                    <button 
                    value={bookTitle}
                    className="border-gray-500 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 px-2 dark:border-white dark:text-white"
                    onClick={addNewcharacter}>
                        {addCharacterState ? <FontAwesomeIcon icon={faPlus} size="xs" className="transition duration-500"/> : <FontAwesomeIcon icon={faMinus} size="xs"/>}
                    </button>
                </div>

                </div>

                {/* ADD CHARACTER FORM */}
                {(!addCharacterState &&
                <div className="flex-1 rounded-md shadow-lg p-3 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300 animate-fadeDown"
                    onKeyDown={(e) => {if (e.key === "Enter") addCharacter();}}>
                    <input className="border p-2 w-full mb-2 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    <input className="border p-2 w-full mb-2 rounded" placeholder="Role / Affiliation" value={role} onChange={e => setRole(e.target.value)} />
                    <textarea className="border p-2 w-full mb-2 rounded" placeholder="Notes" rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
                    <input className="border p-2 w-full mb-2 rounded" placeholder="Abilities (comma separated)" value={abilities} onChange={e => setAbilities(e.target.value)} />
                    <input type="number" className="border p-2 w-full mb-2 rounded" placeholder="First Chapter Appearance" value={chapterAppearance} onChange={e => setChapterAppearance(e.target.value)} />
                    <button
                    type="button"
                    className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                    onClick={addCharacter}
                    >
                    SAVE
                    </button>
                </div>
                )}

            </div>

        </div>
        
        {/* CENTER CONTAINER */}
        <div className="w-full max-w-3xl mx-auto">

            {/* DETAILS / CHARACTERS Display */}
            <div className="px-3 pt-3 mb-3 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900">
            
            {/*CHANGEABLE CURRENT BOOK TITLE */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                <input 
                    title="Edit book title..."
                    className="text-2xl w-full text-center font-semibold border-b-1 border-gray-200 hover:border-gray-500 outline-none focus-ring-0 truncate" 
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={saveBookTitle}
                    onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        (e.target as HTMLElement).blur();
                    }
                    }}
                />
                
                </div>

                {/* THIS IS THE HIDDEN ADD CHARACTER FORM FOR SMALLER DIMENSION */}
                <button 
                onClick={() => setShowAddCharacter(!showAddCharacter)} 
                className="xs:hidden bg-black border border-black text-white text-xs md:text-base px-5 py-2 rounded-md hover:bg-gray-800 transition">
                    {showAddCharacter ? 'Cancel' : 'Add Character'}
                </button>
            </div>

            {/* Input Character Details */}
            {showAddCharacter && (
                <div className="bg-white/30 shadow rounded-md p-4 mb-6 flow-root">
                    <input className="border p-2 w-full mb-2 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    <input className="border p-2 w-full mb-2 rounded" placeholder="Role / Affiliation" value={role} onChange={e => setRole(e.target.value)} />
                    <textarea className="border p-2 w-full mb-2 rounded" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
                    <input className="border p-2 w-full mb-2 rounded" placeholder="Abilities (comma separated)" value={abilities} onChange={e => setAbilities(e.target.value)} />
                    <input type="number" className="border p-2 w-full mb-2 rounded" placeholder="Volume" value={chapterAppearance} onChange={e => setChapterAppearance(e.target.value)} />
                    <button onClick={addCharacter} className="float-right bg-black border border-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">Confirm</button>
                </div>
            )}

            {/* DISPLAY IF CHARACTERS ARE NONE */}
            {character.length === 0 && (
            <div className="w-full flex justify-center items-center py-20"> 
                <h1 className="text-3xl font-bold text-gray-400 text-center"> 
                PLEASE ADD SOME CHARACTERS. IT GETS LONELY SOMETIMES HERE... 
                </h1> 
            </div>
            )}

            {/* Display Character Card Block */}
            <div className="grid gap-4 pb-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 items-stretch place-items-center">
                {currentCharacters.map(char => (

                // CHARACTER CARDS w/ image... //
                <div 
                key={char.id} 
                title="Open character sheet."
                className="
                h-[230px] w-full max-w-sm
                cursor-pointer bg-white shadow-lg rounded-md
                transition-all duration-300
                hover:-translate-y-2 hover:shadow-2xl
                group animate-fadeDown
                flex flex-col
                dark:bg-gray-950"
                onClick={() => openEditCharacter(char)}
                >

                    {/* IMAGE */}
                    <div className="h-100 w-full overflow-hidden rounded-t-xl">
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
                            <p className="text-sm text-gray-400 line-clamp-1">{char.role || "Character Role"}</p>
                            <p className="text-xs text-gray-400 line-clamp-1">Status: {char.status}</p>
                        </a>
                    </div>
                </div>
                ))}
            </div>

            {/* // PAGINATION   */}
            {character.length >= 13 && (
                <div className="flex items-center justify-between pb-2 flex-wrap">

                {/* Previous */}
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-500 rounded disabled:opacity-50"
                >
                    Prev
                </button>

                <div className="flex items-center gap-2">
                    {/* First page shortcut */}
                    {currentPage > 3 && (
                    <>
                        <button
                        onClick={() => setCurrentPage(1)}
                        className="px-3 py-1 bg-gray-300 dark:bg-gray-500 rounded"
                        >
                        1
                        </button>
                        <span>...</span>
                    </>
                    )}

                    {/* Page Numbers */}
                    {getPageNumbers().map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${
                        currentPage === page
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 dark:bg-gray-500"
                        }`}
                    >
                        {page}
                    </button>
                    ))}

                    {/* Last page shortcut */}
                    {currentPage < totalPages - 2 && (
                    <>
                        <span>...</span>
                        <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-1 bg-gray-300 dark:bg-gray-500 rounded"
                        >
                        {totalPages}
                        </button>
                    </>
                    )}
                </div>

                {/* Next */}
                <button
                    onClick={() =>
                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-500 rounded disabled:opacity-50"
                >
                    Next
                </button>

                </div>
            )}

            </div>

        </div>

        {/* RIGHT SIDE CONTAINER */}
        <div className="hidden xs:block flex-1 flex flex-col relative">
            
            {/* NOTES CONTAINER */}
            <div className="PARENT CONTAINER FOR THE NOTES PANEL sticky top-15">

            {/* NOTES TITLE */}
            <div className="flex-1 rounded-md shadow-lg p-3 bg-gray-100 dark:bg-gray-900 mb-2 flex justify-between">

                <h3 
                onClick={displayNotes}
                className="text-2xl font-semibold cursor-pointer hover:text-blue-400 select-none"
                title="Click to minimize notes"
                role="button"
                >Notes</h3>

                <div className="flex justify-center">
                <button 
                    value={bookTitle}
                    className="border-gray-500 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 px-2 transition dark:border-white dark:text-white"
                    onClick={addDraftNotes}>
                    <FontAwesomeIcon icon={faPlus} size="xs"/>
                </button>
                </div>

            </div>

                {/* NOTES CONTENTS */}
                { notesShowState && (
                <div className="h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">

                    {/* THIS IS THE BOOK NOTES */}
                    <div className="">
                        {[ ...(draftNote ? [draftNote] : []), ...bookNotes ].map(notes => (
                        <div 
                            className={`${colorMap[notes.color]} relative p-1 rounded-md shadow-md mb-2 bg-gray-100 dark:bg-gray-900 cursor-pointer animate-fadeDown`}
                            key={notes.id ?? notes.notesId}
                            data-id={notes.id}
                        >

                            <div className="flex justify-between pb-1"> 
                            
                            <span className="text-xs text-gray-800 dark:text-gray-400">
                                {new Date(notes.createdAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                })}
                            </span>

                            <button 
                                className="hover:bg-neutral-300/50 rounded-2xl group"
                                onClick={() => setNoteToDelete(notes)}>
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-700 dark:text-gray-400 group-hover:text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                                </svg>
                            </button>

                            </div>
                            
                            <textarea
                            className="
                            w-full text-sm
                            rounded-md 
                            px-1
                            focus:outline-none focus:ring-2 focus:ring-blue-400 
                            hover:ring-blue-400 hover:ring-2
                            placeholder-gray-400 dark:placeholder-gray-400 
                            resize-none
                            overflow-hidden
                            transition-all duration-200
                            "
                            ref={!notes.id ? draftTextareaRef : null}
                            placeholder="Enter Notes"
                            onFocus={(e) => {autoResize(e); setOnFocusId(String(notes.id!)); setNoteContent(notes.content); setHideSave(true); 
                                if (notes.id) {
                                setDraftstate(false);
                                }
                                else {
                                setDraftstate(true);
                                }
                            }}
                            rows={3}
                            value={notes.content}
                            onChange={(e) => {
                                if (!notes.id) {
                                // This is draft
                                setDraftNote(prev =>
                                    prev ? { ...prev, content: e.target.value } : prev
                                );
                                } else {
                                // This is saved note
                                setBookNotes(prev =>
                                    prev.map(note =>
                                    note.id === notes.id
                                        ? { ...note, content: e.target.value }
                                        : note
                                    )
                                );
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                (e.target as HTMLElement).blur();
                                (saveNote(notes));
                                }
                            }}
                            onBlur={(e) => { e.currentTarget.style.height = "auto";}}
                            />

                            {(hideSave && (notes.id ? Number(onFocusId) === notes.id : draftNoteState) &&
                            <div className="flex justify-end gap-1">
                                {/* {(notSaved &&
                                <span>Not saved</span>
                                )} */}

                                <button 
                                className="flex px-4 py-1 bg-neutral-500 rounded-xl hover:bg-neutral-600"
                                onClick={() => {setHideSave(false); setDraftNote(null);}}
                                >
                                Cancel
                                </button>

                                <button 
                                className="flex px-4 py-1 bg-blue-700 rounded-xl"
                                onClick={() => {saveNote(notes);}}
                                disabled={noteContent === notes.content}
                                >
                                Save 
                                </button> 
                            </div>
                            )}

                            {noteToDelete && noteToDelete.id === notes.id && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-md z-10">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg text-center w-40">
                                <p className="text-sm mb-2">Delete this note?</p>
                                <div className="flex justify-between">
                                    <button
                                    onClick={() => handleDeleteNote(noteToDelete!)}
                                    className="text-red-500 text-sm hover:scale-105"
                                    >
                                    Delete
                                    </button>
                                    <button
                                    onClick={() => setNoteToDelete(null)}
                                    className="text-gray-500 text-sm"
                                    >
                                    Cancel
                                    </button>
                                </div>
                                </div>
                            </div>
                            )}
                        </div>
                        ))}
                    </div>

                </div>

                )}

            </div>

        </div>

        {/* MODALS */}
            {/* Undo Popup */}
            {showUndoPopup && (
                <div className="fixed top-14 left-1/2 bg-gray-300 py-4 px-8 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
                <span>Deleted</span>
                <button 
                    className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm font-semibold flex"
                    onClick={handleUndo}
                    >
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-5"
                    >
                    <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg> Undo
                </button>
                </div>
            )}

            {/* CHANGES SAVED POPUP */}
            {showStatePopup && (
            <div className="fixed top-14 left-1/2 bg-gray-300 py-1 px-5 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
                <span>
                {alertMessage}
                <FontAwesomeIcon className="text-green-500" size="lg" icon={faCheck}/>
                </span>
            </div>
            )}

    {/* MAIN PARENT CONTAINER DIV CLOSER */}
    </div>

  );
}
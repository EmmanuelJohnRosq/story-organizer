import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

import { db, type Book, type Character, type EditableCharacter, type Notes, type CharacterDescription } from "../db";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faCheck, faPlus, faMinus, faEllipsis } from "@fortawesome/free-solid-svg-icons";

export default function ExperimentPage() {
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
    const [charPersonalityTraits, setCharPersonalityTraits] = useState("");
    const [charTags, setCharTags] = useState("");
    const [charSetRaces, setCharSetRaces] = useState("");
    const [charChapterAppearances, setCharChapterAppearances] = useState("");
    const [charCharacterArc, setcharCharacterArc] = useState("");
  
    const [charTraits, setCharTraits] = useState<string[]>([]);

  const [charAbilities, setCharAbilities] = useState<
    { ability: string; description: string }[]
  >([]);
  
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
      };
    }
  
    // DELETE BOOK
    async function deleteBook(id: string) {
      if(!id) return;

      const isConfirmed = window.confirm("Deleting book for real?");

      if(!isConfirmed) return;

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
        abilities: charAbilities,
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
      setCharAbilities([]);
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

      const charName = characters.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

      const slug = upcaseLetter(charName);

      navigate(`/book/${currentBookId}/${characters.id}-${slug}`);
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

    // SAVE BOOK TAGS
    async function saveTags() {
      if(!bookTags) return;
      const UpdatebookTags = { tags: bookTags.split(",").map(a => normalizeWhitespace(a))};
      await db.books.update(currentBookId, UpdatebookTags);
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
    const [notesShowState, setNotesShowState] = useState(false);
    const [addCharacterState, setAddCharState] = useState(true);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

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

    const filled = (value: unknown) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "string") return value.trim().length > 0;
      return Boolean(value);
    }

    const getCharacterCompletion = (char: Character) => {
      const descriptionFields = [
        char.description.basic.age,
        char.description.basic.race,
        char.description.basic.gender,
        char.description.face.faceShape,
        char.description.face.eyeColor,
        char.description.face.eyeShape,
        char.description.face.noseShape,
        char.description.face.mouthSize,
        char.description.hair.hairColor,
        char.description.hair.hairStyle,
        char.description.body.bodyType,
        char.description.body.height,
        char.description.body.skinTone,
        char.description.extras.distinguishingFeatures,
        char.description.extras.accessories,
        char.description.extras.clothingStyle,
      ];

      const requiredFields = [
        char.name,
        char.role,
        char.status,
        char.importance,
        char.occupation,
        char.notes,
        char.futureNotes,
        char.characterArc,
        char.netWorth,
        char.powerLevel,
        char.chapters,
        char.chapterAppearances,
        char.setRace,
        char.tags,
        char.titles,
        char.personalityTraits,
        char.abilities,
        char.relationships,
        ...descriptionFields,
      ];

      const completeCount = requiredFields.filter(filled).length;
      return Math.round((completeCount / requiredFields.length) * 100);
    };

    const averageCompletion = character.length
      ? Math.round(character.reduce((acc, char) => acc + getCharacterCompletion(char), 0) / character.length)
      : 0;

    const incompleteCharacters = character.filter(char => getCharacterCompletion(char) < 100).length;

    const bookChips = [
      ...(currentBook?.genre ?? []).map(text => ({ text, type: 'genre' })),
      ...(currentBook?.tags ?? []).map(text => ({ text, type: 'tag' }))
    ];

  return (
    // MAIN PARENT CONTAINER DIV CLOSER
    <div className="w-full mx-auto pt-15 px-2">

        {/* PAGE TITLE */}
        <div className="px-4 py-2 flex justify-between items-center relative">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight line-clamp-1">{titleDraft || currentBook?.title || "Book Page"}</h1>

          <button
            className="border-gray-500 text-black rounded-xl px-1 dark:text-white hover:bg-gray-600"
            onClick={() => setShowSettingsMenu(prev => !prev)}
            title="Book settings"
          >
            <FontAwesomeIcon icon={faEllipsis} size="xl"/>
          </button>

          {showSettingsMenu && (
            <div className="absolute top-13 right-3 z-30 w-56 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-600 shadow-xl p-2 space-y-1">
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  setAddnewBooks(false);
                  setShowSettingsMenu(false);
                }}
              >
                Edit book details
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  setAddCharState(false);
                  setShowSettingsMenu(false);
                }}
              >
                Add character
              </button>

              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-sky-700/50"
                onClick={() => {addDraftNotes(); setShowSettingsMenu(false)}}
              >
                Add draft note
              </button>

              <button
                className="w-full text-left px-3 py-2 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={() => {
                  if (currentBook?.id) deleteBook(currentBook.id);
                }}
              >
                Delete book
              </button>
            </div>
          )}
        </div>

        {/* CONTENT CONTAINER */}
        <div className="xs:grid grid-cols-10 gap-2 items-start">
    
          {/* LEFT SIDE CONTAINER */}
          <div className="hidden col-span-3 xs:flex flex-1 relative">

              {/* BOOK AND CHARACTER FORMS LEFT PANEL */}
              <div className="sticky top-15 h-[calc(100vh-7rem)] w-full overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">

                {/* BOOK SUMMARY FORM */}
                {!Addnewbooks && (
                  // BOOK DETAILS
                  <div className="flex-1 rounded-md shadow-lg pt-4 px-4 pb-1 mb-1 bg-gray-100 dark:bg-gray-900 transition duration-300 animate-fadeDown">
                    <form className="space-y-2">

                        {/* Summary */}
                        <div>
                          <label className="text-sm font-semibold">
                            Book Content
                          </label>

                          <label className="block text-xs text-neutral-400 mb-1">
                            Volume {bookVolume} • Volume Name • {upcaseLetter(bookStatus)}
                          </label>
                          
                          <textarea
                              rows={12}
                              className="w-full px-1 py-1 focus:outline-none text-sm placeholder-gray-400 dark:placeholder-gray-600 text-area-scroll"
                              placeholder="Update book summary"
                              value={bookSummary}
                              onFocus={(e) => autoResize(e)}
                              onBlur={(e) => { e.currentTarget.style.height = "auto";}}
                              onChange={e => setBookSummary(e.target.value)}
                          />
                        </div>
                    </form>
                  </div>
                )}

                {/* CHARACTER GENRE AND TAGS */}
                <div className="rounded-md shadow-lg p-4 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300">
                  <label className="text-sm font-semibold mb-2">Book Classification</label>
                  <div className="flex flex-wrap gap-2">
                    {bookChips.length ? (
                      bookChips.map((chip, index) => (
                        <span 
                          key={`${chip.type}-${chip.text}-${index}`} 
                          className={`px-3 py-1 rounded-full text-sm ${
                            chip.type === 'genre' 
                              ? "bg-blue-200 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200" // Genre Style
                              : "bg-purple-200 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200" // Tag Style
                          }`}
                        >
                          {chip.text}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No data yet.</span>
                    )}
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
          <div className="col-span-5 w-full">

            {/* CHARACTER DATA COMPLETION PROGRESS BAR */}
            <div className="rounded-md shadow-lg p-4 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">Character Profile Completion</label>
                <span className="text-sm text-gray-500 dark:text-gray-400">{averageCompletion}%</span>
              </div>

              <div className="w-full h-3 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  style={{ width: `${averageCompletion}%` }}
                />
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400">{incompleteCharacters} {incompleteCharacters > 1 ? 'characters' : 'character'} still need schema updates.</p>
            </div>

            {/* DETAILS / CHARACTERS Display */}
            <div className="px-3 pt-3 mb-3 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900">

              {/* Input Character Details */}
              {showAddCharacter && (
                  <div className="shadow rounded-md p-4 mb-6 flow-root">
                      <input className="border p-2 w-full mb-2 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                      <input className="border p-2 w-full mb-2 rounded" placeholder="Role / Affiliation" value={role} onChange={e => setRole(e.target.value)} />
                      <textarea className="border p-2 w-full mb-2 rounded" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
                      <input className="border p-2 w-full mb-2 rounded" placeholder="Abilities (comma separated)" value={abilities} onChange={e => setAbilities(e.target.value)} />
                      <input type="number" className="border p-2 w-full mb-2 rounded" placeholder="Volume" value={chapterAppearance} onChange={e => setChapterAppearance(e.target.value)} />
                      <button onClick={addCharacter} className="float-right bg-black border border-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">Confirm</button>
                  </div>
              )}

              {/* CHARACTER GRID TITLE */}
              <h3 className="text-semibold mb-1 ml-2">Character Grid</h3>

              {/* DISPLAY IF CHARACTERS ARE NONE */}
              {character.length === 0 && (
              <div className="w-full flex justify-center items-center py-20"> 
                  <h1 className="text-3xl font-bold text-gray-400 text-center"> 
                  PLEASE ADD SOME CHARACTERS. IT GETS LONELY SOMETIMES HERE... 
                  </h1> 
              </div>
              )}
              
              {/* Display Character Card Block */}
              <div className="grid gap-2 pb-4 grid-cols-2 sm:grid-cols-3 items-stretch place-items-center">
                  {currentCharacters.map(char => (

                  // CHARACTER CARDS w/ image... //
                  <div 
                  key={char.id} 
                  title="Open character sheet."
                  className="
                  h-15 w-full
                  cursor-pointer bg-white shadow-2xl rounded-4xl
                  transition-all duration-300
                  hover:bg-gray-100 dark:hover:bg-black 
                  group animate-fadeDown
                  flex items-center pl-2
                  dark:bg-gray-950"
                  onClick={() => openEditCharacter(char)}
                  >

                    <div className="flex gap-2">
                      {/* IMAGE */}
                      <div className="flex h-12 w-12 overflow-hidden shrink-0 rounded-full items-center">
                        <a>
                            <img 
                            className="h-full w-full object-cover group-hover:scale-105 transition" 
                            src={imageMap[char.id] || char_image}
                            alt="Default Character Image" />
                        </a>
                      </div>

                      <div className="flex flex-col justify-center"> 
                        <a href="#">
                          <h3 className="text-sm font-semibold tracking-tight line-clamp-1 leading-none">
                            {char.name}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            • {char.role || "Character Role"}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            • {upcaseLetter(char.status)}
                          </p>
                        </a>
                      </div>

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
          <div className="hidden col-span-2 xs:flex flex-col relative animate-fadeRight transition delay-500 duration-900">
              
              {/* NOTES CONTAINER */}
              <div className="PARENT CONTAINER FOR THE NOTES PANEL">

                {/* NOTES CONTENTS */}
                <div className="h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">

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

              </div>

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

          {/* ADD NOTE GLOBAL BUTTON */}
          {bookNotes.length < 6 && (
            <button
              onClick={addDraftNotes}
              className={`fixed bottom-5 right-5 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-3 shadow-xl transition ${draftNote ? 'hidden' : 'block'}`}
              title="Add note"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Quick Note
            </button>
          )}
          

    {/* MAIN PARENT CONTAINER DIV CLOSER */}
    </div>

  );
}
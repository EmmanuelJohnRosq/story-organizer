import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef, type Dispatch, type SetStateAction, type FormEvent } from "react";

import Navbar, { type NavbarAction } from "../components/Navbar";

import { db, type Book, type Character, type EditableCharacter, type Notes, type CharacterDescription, type CharImage, type WorldbuildingSection, type WorldbuildingEntry } from "../db";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faCheck, faPlus, faMinus, faEllipsis, faUserPlus, faNoteSticky, faTableColumns, faWandMagicSparkles, faProjectDiagram, faGlobe, faPenToSquare, faFileLines, faHouse, faStar } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";

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
    const [showAddCharacter, setShowAddCharacter] = useState(true);
  
    // CHARACTER DATA
    const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
    const [editingCharacter, setEditingCharacter] = useState<EditableCharacter | null>(null);
    const [originalCharacter, setOriginalCharacter] = useState<Character | null>(null);
  
    // CHARACTER IMAGE GENERATION w/ PUTER.js
    const [imageMap, setImageMap] = useState<Record<string, CharImage[]>>({});
  
    // EDITING OF BOOK TITLE
    const [titleDraft, setTitleDraft] = useState("");
    const [savedTitle, setSavedTitle] = useState(false);
    const [titleEditing, settitleEditing] = useState(false);
  
    // BOOK DETAILS
    const [bookSummary, setBookSummary] = useState("");
    const [bookVolume, setBookVolume] = useState<string>("0");
    const [bookVolName, setbookVolName] = useState("");
    const [bookChapterCount, setBookChapterCount] = useState(0);
    const [bookStatus, setBookStatus] = useState("ongoing"); // default
    const [bookTags, setBookTags] = useState<string[]>([]);
    const [bookGenre, setBookGenre] = useState<string[]>([]);

    const genreOptions = [
      "Action", "Adventure", "Drama", "Erciyuan", "Fantasy", "Gender-Bender", "Historical", 
      "Josei", "Mature", "Military", "Psychological", "School-Life", "Seinen", "Shoujo-Ai", 
      "Shounen-Ai", "Smut", "Supernatural", "Urban-Life", "Xianxia", "Yaoi", "Adult", "Comedy", 
      "Ecchi", "Fan-Fiction", "Game", "Harem", "Horror", "Martial-Arts", "Mecha", "Mystery", 
      "Romance", "Sci-Fi", "Shoujo", "Shounen", "Slice-Of-Life", "Sports", "Tragedy", "Wuxia", "Xuanhuan", "Yuri",
    ];

    const tagOptions = {
      Story_Tropes: [
      "Reincarnation", 
      "System", 
      "Overpowered MC", 
      "Villain MC",
      "Slow Burn", 
      "Dark Fantasy", 
      "Kingdom Building", 
      "Academy", 
      "Cultivation", 
      "Time Travel", 
      "Isekai", 
      "Game Elements",
      "Villainess", 
      "Enemies to Lovers", 
      "Found Family", 
      "Political Intrigue", 
      "Dungeon", 
      "Survival", 
      "Mystery Arc", 
      "Revenge", 
      "Magic", 
      "Sword & Sorcery",
      ],

      // Fantasy & Power Systems
      Fantasy: [
      "Elemental Magic",
      "Necromancy",
      "Summoning",
      "Artifact Hunting",
      "Ancient Relics",
      "Divine Powers",
      "Forbidden Magic",
      "Bloodline Powers",
      "Legendary Weapons",
      "Spirit Contracts",
      ],

      // Character Progression
      Progression: [
      "Character Growth",
      "Training Arc",
      "Weak to Strong",
      "Hidden Power",
      "Secret Identity",
      "Chosen One",
      "Redemption Arc",
      "Fallen Hero",
      "Reluctant Hero",
      "Evil Mc",
      ],

      // Story Tone / Theme
      Theme: [
      "Tragedy",
      "Comedy",
      "Dark Themes",
      "Wholesome",
      "Psychological",
      "Philosophical",
      "Moral Dilemma",
      "Hopeful",
      "Bittersweet",
      "Epic Journey",
      ],

      // Romance Tropes
      Romance_Tropes: [
      "Slow Romance",
      "Love Triangle",
      "Forbidden Love",
      "Childhood Friends",
      "Fake Relationship",
      "Opposites Attract",
      "Second Chance Romance",
      "Tragic Romance",
      ],

      // Worldbuilding
      Worldbuidling: [
      "Empire Politics",
      "Guild System",
      "Adventurers",
      "Noble Society",
      "Royal Court",
      "Rebellion",
      "War",
      "Empire Building",
      "Exploration",
      "Lost Civilization",
      ],

      // Adventure & Conflict
      Adventure: [
      "Treasure Hunt",
      "Monster Hunting",
      "War Strategy",
      "Assassination",
      "Espionage",
      "Bounty Hunters",
      "Mercenaries",
      "Battle Tournament",
      "Questing",
      ],

      // Mystery & Thriller
      Mystery: [
      "Investigation",
      "Secret Conspiracy",
      "Hidden Truth",
      "Plot Twists",
      "Mind Games",
      "Unreliable Narrator",
      ],

      // Emotional Themes
      Emotional: [
      "Betrayal",
      "Friendship",
      "Sacrifice",
      "Identity Crisis",
      "Self Discovery",
      "Family Drama",
      "Loss",
      "Loneliness",
      ],
    };
  
    // CHARACTER DETAILS INITIALIZE
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [notes, setNotes] = useState("");
    const [abilities, setAbilities] = useState("");
    const [race, setRace] = useState("");
    const [status, setStatus] = useState("");
    const [chapterAppearance, setChapterAppearance] = useState("");
  
    //NEW CHARACTER SCHEMA INITIALIZE
    const [charStatus, setCharStatus] = useState("unknown");
    const [charImportance, setCharImportance] = useState("unknown");
    const [charOccupation, setCharOccupation] = useState("");
    const [charFutureNotes, setCharFutureNotes] = useState("");
    const [charNetWorth, setCharNetWorth] = useState("");
    const [charPowerLevel, setCharPowerLevel] = useState("");
    const [charCharacterArc, setcharCharacterArc] = useState("");
  
    // Arrays (comma-separated input)
    const [charTitles, setCharTitles] = useState<string[]>([]); // input as string -> array on save
    const [charPersonalityTraits, setCharPersonalityTraits] = useState<string[]>([]);
    const [charTags, setCharTags] = useState<string[]>([]);
    const [charSetRace, setCharSetRace] = useState<string[]>([]);
    const [charChapterAppearances, setCharChapterAppearances] = useState<string[]>([]);

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

    const toggleBookArrayValue = (
      value: string,
      values: string[],
      setter: Dispatch<SetStateAction<string[]>>,
    ) => {
      if (values.includes(value)) {
        setter(values.filter(item => item !== value));
        return;
      }

      setter([...values, value]);
    };
  
    // create new character to save to db
    async function addCharacter(event: any) {
      if (!name || currentBookId === undefined) return;
      event.preventDefault();
  
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
        titles: charTitles,
        personalityTraits: charPersonalityTraits,
        tags: charTags,
        setRace: [race],
        chapterAppearances: charChapterAppearances,
        relationships: charRelationships,
        description: charDescription,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
  
      await db.characters.add(newCharacter);
  
      setCharacters(prev => [...prev, newCharacter]);
      setCurrentPage(totalPages);
  
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
      setcharCharacterArc("");
  
      setCharTitles([]);
      setCharAbilities([]);
      setCharPersonalityTraits([]);
      setCharTags([]);
      setCharChapterAppearances([]);
      setCharSetRace([]);
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
        setBookGenre(currentBook.genre ?? []);
        setBookVolume(String(currentBook.volume));
        setbookVolName(currentBook.volumeName);
        setBookTags(currentBook.tags ?? []);
        setBookChapterCount(currentBook.chapterCount ?? 0);
        setBookStatus(currentBook.status ?? "ongoing");
      }
    }, [currentBook]);

    // SAVE EDIT BOOK DETAILS
    async function saveBookDetails(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!currentBookId) return;

      const updatedBook = {
        title: normalizeWhitespace(titleDraft),
        summary: bookSummary.trim(),
        volume: Number(bookVolume) || 0,
        volumeName: normalizeWhitespace(bookVolName),
        status: bookStatus,
        chapterCount: Number(bookChapterCount) || 0,
        tags: bookTags,
        genre: bookGenre,
      };

      await db.books.update(currentBookId, updatedBook);
      setCurrentBook(prev => (prev ? { ...prev, ...updatedBook } : prev));

      setAlert("Changes Saved");
      setStatePopup(true);
      setTimeout(() => { setStatePopup(false); setAlert(""); }, 2000);
      setEditBookContent(false);
    }

    function cancelBookDetailsEdit() {
      if (currentBook) {
        setTitleDraft(currentBook.title);
        setBookSummary(currentBook.summary);
        setBookVolume(String(currentBook.volume));
        setbookVolName(currentBook.volumeName);
        setBookStatus(currentBook.status ?? "ongoing");
        setBookChapterCount(currentBook.chapterCount ?? 0);
        setBookGenre([...(currentBook.genre ?? [])]);
        setBookTags([...(currentBook.tags ?? [])]);
      }

      setEditBookContent(false);
    }

    function cancelCharacterAdd() {
      if (currentBook) {
        setName("");
        setRole("");     
        setCharStatus("unknown");
        setCharImportance("unknown");
        setChapterAppearance("");
        setRace("");
      }

      setAddCharState(false);
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
      
      images.sort((a, b) => b.createdAt - a.createdAt);

      const newMap: Record<string, CharImage[]> = {};

      images.forEach((img) => {
        const url = URL.createObjectURL(img.imageBlob);
        const id = img.charId.toString(); // Convert to string for the key

        if (!newMap[id]) {
          newMap[id] = [];
        }

        newMap[id].push({
          url: url,
          imageId: img.imageId,
          isDisplayed: img.isDisplayed,
          createdAt: img.createdAt,
        });
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
      gray: "bg-gray-200 dark:bg-gray-950"
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
          pinned: false,
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

    const togglePin = async (note: any) => {
      const newPinnedStatus = !note.pinned;

      // 1. Update UI State immediately (Optimistic UI)
      setBookNotes(prev => 
        prev.map(n => n.id === note.id ? { ...n, pinned: newPinnedStatus } : n)
      );

      // 2. Update Database
      try {
        await db.notes.update(note.id, { pinned: newPinnedStatus });
      } catch (error) {
        console.error("Failed to update pin status:", error);
        // Optional: Revert state if DB update fails
      }
    };
  
    const [notesShowState, setNotesShowState] = useState(false);
    const [addCharacterState, setAddCharState] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [editBookContent, setEditBookContent] = useState(false);

    const [showPinnedNotes, setShowPinnedNotes] = useState(true);
 
    const [isNotesDrawerMounted, setIsNotesDrawerMounted] = useState(false);
    const [isNotesDrawerVisible, setIsNotesDrawerVisible] = useState(false);

    const [isNotesDrawerClosing, setIsNotesDrawerClosing] = useState(false);
    const [notesDrawerCloseTransform, setNotesDrawerCloseTransform] = useState("");

    const [showBookContent, setShowBookContent] = useState(false);

    const notesFabRef = useRef<HTMLButtonElement | null>(null);
    const notesDrawerPanelRef = useRef<HTMLDivElement | null>(null);
  
    // SHOW/HIDE ADD CHARACTER FORM
    const addNewcharacter = () => {
        setAddCharState(!addCharacterState);
        setEditBookContent(false);
    };

    // SHOW/HIDE EDIT CONTENT FORM
    const editBook = () => {
        setEditBookContent(!editBookContent);
        setAddCharState(false);
    };

    const notesDrawerTimeoutRef = useRef<number | null>(null);

    const openNotesDrawer = () => {
      if (notesDrawerTimeoutRef.current) {
        clearTimeout(notesDrawerTimeoutRef.current);
        notesDrawerTimeoutRef.current = null;
      }

      setIsNotesDrawerMounted(true);
      setNotesShowState(true);
      setIsNotesDrawerClosing(false);
      addDraftNotes();

      requestAnimationFrame(() => {
        setIsNotesDrawerVisible(true);
      });
    };

   const calculateCloseTransform = () => {
    if (!notesFabRef.current || !notesDrawerPanelRef.current) return;

    const fab = notesFabRef.current.getBoundingClientRect();
    const panel = notesDrawerPanelRef.current.getBoundingClientRect();

    const fabCenterX = fab.left + fab.width / 3;
    const fabCenterY = fab.top + fab.height / 3;

    const panelCenterX = panel.left + panel.width / 3;
    const panelCenterY = panel.top + panel.height / 3;

    const dx = fabCenterX - panelCenterX;
    const dy = fabCenterY - panelCenterY;

    setNotesDrawerCloseTransform(
      `translate3d(${dx}px, ${dy}px, 0) scale(0.03) rotate(60deg)`
    );
  };

    const closeNotesDrawer = () => {
      calculateCloseTransform();

      setIsNotesDrawerClosing(true);
      setIsNotesDrawerVisible(false);
      setNotesShowState(false);
      setDraftNote(null)

      notesDrawerTimeoutRef.current = window.setTimeout(() => {
        setIsNotesDrawerMounted(false);
        setIsNotesDrawerClosing(false);
        notesDrawerTimeoutRef.current = null;
      }, 300);
    };
  
    // SHOW/HIDE NOTES DISPLAY
    const displayNotes = () => {
       if (notesShowState) {
        closeNotesDrawer();
        return;
      }

      openNotesDrawer();
    };

    useEffect(() => {
      return () => {
        if (notesDrawerTimeoutRef.current) {
          clearTimeout(notesDrawerTimeoutRef.current);
        }
      };
    }, []);
  
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
  
    const pageWindow = 2; // how many page numbers to show
  
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

    const sampleWorldWiki: WorldbuildingSection[] = [
      {
        id: "Rules",
        title: "World Rules",
        bookId: "",
        entries: [
          { label: "Year", value: "Aster Cycle 472" },
          { label: "Travel", value: "Gateways open only during moonrise tides." },
          { label: "Law", value: "Memory-forging magic is forbidden in all Free Cities." },
        ],
      },
      {
        id: "Power System",
        title: "Power System",
        bookId: "",
        entries: [
          { label: "Source", value: "Aether Threads woven through the sky." },
          { label: "Cost", value: "Every cast consumes heat from the body and short-term memory." },
          { label: "Ranks", value: "Sparkborn → Channeler → Warden → Astral" },
        ],
      },
      {
        id: "Factions",
        title: "Factions & Culture",
        bookId: "",
        entries: [
          { label: "Dominant Faction", value: "The Cartographer Guild controls map-gates and sea routes." },
          { label: "Religion", value: "The Nine Lantern rites guide mourning, naming, and oath-binding." },
          { label: "Current Conflict", value: "A civil split over opening the sealed northern ruins." },
        ],
      },
      {
        id: "Hooks",
        title: "Story Hooks",
        bookId: "",
        entries: [
          { label: "Secret", value: "The protagonist's bloodline can restore dead gateways." },
          { label: "Foreshadow", value: "Black snow appears one day before a realm fracture." },
        ],
      },
      {
        id: "Source",
        title: "Power Source",
        bookId: "",
        entries: [
          { label: "Mana", value: "Mana is the Universe's General Energy." },
          { label: "Divine power", value: "Divine Power is an energy level higher than Mana." },
          { label: "Bloodline", value: "Beasts, Demons, and Hell Spawns have bloodline powers, advantage of some other races unlike humans." },
        ],
      },
      {
        id: "Level",
        title: "Power Level",
        bookId: "",
        entries: [
          { label: "Tier 0", value: "Mortal/Human/Animals/Items" },
          { label: "Tier 1", value: "Awakener/Knight and Mage Apprentice/Beast/Items" },
          { label: "Tier 2", value: "Knight/Mage/Beast" },
          { label: "Tier 3", value: "GrandKnight/GrandMage/Magic Beast" },
          { label: "Tier 4", value: "Supreme Mage/Knight" },
          { label: "Tier 5", value: "Saint Domain" },
          { label: "Tier 6", value: "Demigod" },
          { label: "Tier 7", value: "Godhood" },
        ],
      },
    ];

    const [worldbuildingSections, setWorldbuildingSections] = useState<WorldbuildingSection[]>(sampleWorldWiki);
    const [showWorldbuildingModal, setShowWorldbuildingModal] = useState(false);
    const [worldSectionTitle, setWorldSectionTitle] = useState("");
    const [worldDraftEntries, setWorldDraftEntries] = useState<WorldbuildingEntry[]>([{ label: "", value: "" }]);

    const [openWorldSections, setOpenWorldSections] = useState<Record<string, boolean>>(() => {
      const initial: Record<string, boolean> = {};
      sampleWorldWiki.forEach(s => initial[s.id] = true);
      return initial;
    });

    const openWorldbuildingModal = () => {
      setWorldSectionTitle("");
      setShowWorldbuildingModal(true);
      setShowSettingsMenu(false);
    };

    const addWorldDraftEntry = () => {
      setWorldDraftEntries(prev => [...prev, { label: "", value: "" }]);
    };

    const updateWorldDraftEntry = (index: number, key: "label" | "value", newValue: string) => {
      setWorldDraftEntries(prev => prev.map((entry, i) => (
        i === index ? { ...entry, [key]: newValue } : entry
      )));
    };

    const removeWorldDraftEntry = (index: number) => {
      setWorldDraftEntries(prev => {
        if (prev.length === 1) return prev;
        return prev.filter((_, i) => i !== index);
      });
    };

    const saveWorldbuildingSection = async () => {
      const normalizedTitle = normalizeWhitespace(worldSectionTitle);
      const cleanEntries = worldDraftEntries
        .map(entry => ({
          label: normalizeWhitespace(entry.label),
          value: entry.value.trim().replace(/\s+/g, " "),
        }))
        .filter(entry => entry.label && entry.value);

      if (!normalizedTitle || cleanEntries.length === 0) {
        return;
      }

      const sectionId = `${normalizedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

      const newSettings = {
        id: sectionId,
        title: normalizedTitle,
        bookId: String(currentBookId),
        entries: cleanEntries,
      }

      setWorldbuildingSections(prev => [
        ...prev, newSettings
      ]);

      await db.worldSetting.add(newSettings);
      setOpenWorldSections(prev => ({ ...prev, [sectionId]: true }));
      setShowWorldbuildingModal(false);

      setWorldDraftEntries([{ label: "", value: "" }]);
    };

    const toggleWorldSection = (sectionId: string) => {
      setOpenWorldSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    // navbar pass actions and logic
    const navbarActions: NavbarAction[] = [
      {
        id: "home",
        label: "Home",
        icon: faHouse,
        onClick: () => navigate("/"),
        title: "Back to library",
      },
      {
        id: "create-character",
        label: !addCharacterState ? "Create" : "Close Form",
        icon: faUserPlus,
        onClick: addNewcharacter,
        isActive: addCharacterState,
        title: "Add character",
      },
      {
        id: "edit-book",
        label: !editBookContent ? "Book" : "Close Book",
        icon: faPenToSquare,
        onClick: editBook,
        isActive: editBookContent,
        title: "Edit book content",
      },
      {
        id: "world-building",
        label: "World",
        icon: faGlobe,
        onClick: openWorldbuildingModal,
        isActive: showWorldbuildingModal,
        title: "Set book facts",
      },
      {
        id: "dashboard",
        label: "Dashboard",
        icon: faTableColumns,
        onClick: () => alert("Currently, in development..."),
        badge: "Soon",
        title: "Dashboard",
      },
      {
        id: "ai-assist",
        label: "AI",
        icon: faWandMagicSparkles,
        onClick: () => alert("Currently, in development..."),
        badge: "Soon",
        title: "AI-assist",
      },
      {
        id: "character-graph",
        label: "Graph",
        icon: faProjectDiagram,
        onClick: () => alert("Currently, in development..."),
        badge: "Soon",
        title: "Characters map graph",
      },
      {
        id: "chapter-prep",
        label: "Prepare",
        icon: faFileLines,
        onClick: () => alert("Currently, in development..."),
        badge: "Soon",
        title: "Chapter Preparation workspace",
      },
    ];

  return (
    // MAIN PARENT CONTAINER DIV CLOSER
    <div className="pt-15 xxs:pt-0 w-full mx-auto px-2">
      <Navbar actions={navbarActions} />

      {/* CONTENT CONTAINER */}
      <div className="grid grid-col-2 xxs:grid-cols-17 xl:grid-cols-9 gap-2 justify-center xxs:pt-14">

        {/* LEFT SIDE CONTAINER */}
        <div className="col-span-1 xxs:col-start-2 xxs:col-span-7 xl:col-start-2 xl:col-span-3 flex-1">

            {/* BOOK AND CHARACTER FORMS LEFT PANEL */}
            <div className="w-full">
              <div className="">
                {/* ADD CHARACTER FORM */}
                {(addCharacterState &&
                  <form
                    className="flex-1 rounded-xl shadow-2xl p-6 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all duration-300 animate-fadeDown"
                    onSubmit={addCharacter}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Add New Character</h2>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                        Draft Mode
                      </span>
                    </div>

                    <div className="space-y-5 my-2">
                      {/* Name Input */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Full Name</label>
                        <input 
                          className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition" 
                          placeholder="e.g. Artorius Pendragon" 
                          value={name} 
                          onChange={e => setName(e.target.value)}
                          required 
                        />
                      </div>

                      {/* Row for Role & Race */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Role</label>
                          <select 
                            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none cursor-pointer"
                            value={role} 
                            onChange={e => setRole(e.target.value)}
                            required
                          >
                            <option value="">Select Role</option>
                            <option value="protagonist">Protagonist</option>
                            <option value="antagonist">Antagonist</option>
                            <option value="supporting">Supporting character</option>
                            <option value="confidant">Confidant</option>
                            <option value="mentor">Mentor</option>
                            <option value="love interest">Love interest</option>
                            <option value="background">Background character</option>
                            <option value="rival">Rival</option>
                            <option value="side character">Side character</option>
                            <option value="unknown">Unknown</option>
                          </select>
                        </div> 

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Race</label>
                          <select 
                            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none cursor-pointer"
                            value={race} 
                            onChange={e => setRace(e.target.value)}
                            required
                          >
                            <option value="">Select Race</option>
                            <option value="human">Human</option>
                            <option value="elf">Elf</option>
                            <option value="dwarf">Dwarf</option>
                            <option value="orc">Orc</option>
                            <option value="dragon">Dragon</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Row for Status & Appearance */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Status</label>
                          <select 
                            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none cursor-pointer"
                            value={status} 
                            onChange={e => setStatus(e.target.value)}
                            required
                          >
                            <option value="Alive">Alive</option>
                            <option value="Deceased">Deceased</option>
                            <option value="Deceased">Undead</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">First Chapter Appearance</label>
                          <input 
                            type="number" 
                            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition" 
                            placeholder="Ch. #" 
                            value={chapterAppearance} 
                            onChange={e => setChapterAppearance(e.target.value)} 
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                      Create Character
                    </button>

                    <button
                      type="button"
                      className="w-full my-3 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-gray-700/30 transform transition-all5"
                      onClick={cancelCharacterAdd}
                    >
                      Cancel
                    </button>
                  </form>
                )}

                {/* EDIT BOOK CONTENT FORM */}
                {(editBookContent &&
                  <form
                    className="flex-1 rounded-xl shadow-2xl p-6 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transition-all duration-300 animate-fadeDown"
                    onSubmit={saveBookDetails}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Edit Book Details</h2>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                        Draft Mode
                      </span>
                    </div>

                    <div className="space-y-5 my-2">
                      {/* Title Input */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Book Title</label>
                        <input
                          className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
                          placeholder="Enter book title"
                          value={titleDraft}
                          onChange={e => setTitleDraft(e.target.value)}
                          required
                        />
                      </div>

                      {/* Book Volume */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Book Volume</label>
                          <input
                            type="number"
                            min={0}
                            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="e.g. 1"
                            value={bookVolume}
                            onChange={e => setBookVolume(e.target.value)}
                            required
                          />
                        </div> 

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Volume Name</label>
                          <input
                            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="e.g. Dawn of Ashes"
                            value={bookVolName}
                            onChange={e => setbookVolName(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Book status */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Status</label>
                          <select 
                            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none cursor-pointer"
                            value={bookStatus}
                            onChange={e => setBookStatus(e.target.value)}
                            required
                          >
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="hiatus">Hiatus</option>
                            <option value="dropped">Dropped</option>
                          </select>
                        </div>

                        {/* CHAPTER COUNT */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Chapter Count</label>
                          <input
                            type="number"
                            min={0}
                            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="0"
                            value={bookChapterCount}
                            onChange={e => setBookChapterCount(Number(e.target.value))}
                            required
                          />
                        </div>
                      </div>

                      {/* Summary */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Summary</label>
                        <textarea
                          rows={8}
                          className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition resize-y notes-scroll"
                          placeholder="Write book summary"
                          value={bookSummary}
                          onChange={e => setBookSummary(e.target.value)}
                        />
                      </div>

                      {/* Genre check list */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Genre</label>
                        <div className="grid grid-cols-2 gap-x-10 gap-y-1 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          {genreOptions.map(option => (
                            <label key={option} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-400 dark:border-gray-600 dark:bg-gray-800"
                                checked={bookGenre.includes(option)}
                                onChange={() => toggleBookArrayValue(option, bookGenre, setBookGenre)}
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Tags dropdown select */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Tags</label>
                        <select
                          className="rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
                          value=""
                          onChange={e => {
                            if (!e.target.value) return;
                            toggleBookArrayValue(e.target.value, bookTags, setBookTags);
                          }}
                        >
                          <option value="">Select tags...</option>
                          {Object.entries(tagOptions).map(([category, tags]) => (
                            <optgroup className="text-sm text-gray-500 font-semibold" key={category} label={category.replace("_", " ")}>
                              {tags.map((tag) => (
                                <option className="text-black dark:text-white" key={tag} value={tag}>
                                  {tag}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {bookTags.length ? bookTags.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleBookArrayValue(tag, bookTags, setBookTags)}
                              className="px-3 py-1 rounded-full text-sm bg-purple-200 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200"
                              title="Click to remove"
                            >
                              {tag}
                            </button>
                          )) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No tags selected.</span>
                          )}
                        </div>
                      </div>

                    </div>

                    <button
                      type="submit"
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                      Save book details
                    </button>

                    <button
                      type="button"
                      className="w-full my-3 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-gray-700/30 transform transition-all5"
                      onClick={cancelBookDetailsEdit}
                    >
                      Cancel
                    </button>

                  </form>
                )}

                {/* BOOK SUMMARY FORM */}
                {!editBookContent && (
                  <div className="flex flex-col">
                    <div className="flex-1 rounded-md shadow-lg pt-4 px-4 pb-1 mb-1 bg-gray-100 dark:bg-gray-900 transition duration-300 animate-fadeDown ">
                      <div className="space-y-2">

                          {/* Summary */}
                          <div>

                            {/* book title and settings dropdown */}
                            <div className="flex justify-between">
                              <label className="text-xl font-semibold truncate">
                                {titleDraft || currentBook?.title || "Book Content"}
                              </label>

                              <div className="relative inline-block"> 
                                <button
                                  className="border-gray-500 text-black rounded-xl px-1 dark:text-gray-500 hover:text-white"
                                  onClick={() => setShowSettingsMenu(prev => !prev)}
                                  title="Book settings"
                                >
                                  <FontAwesomeIcon icon={faEllipsis} size="lg"/>
                                </button>

                                {showSettingsMenu && (
                                  <div className="absolute top-9 right-1 z-30 w-56 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-600 shadow-xl p-2 space-y-1">
                                    
                                    {/* minimize book details */}
                                    <button
                                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                      onClick={() => {
                                        setShowBookContent(prev => !prev);
                                      }}
                                    >
                                      {showBookContent ? "Maximize" : "Minimize"}
                                    </button>
                                    
                                    {/* open edit book details */}
                                    <button
                                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                      onClick={() => {
                                        editBook()
                                        setShowSettingsMenu(false);
                                      }}
                                    >
                                      Edit book details
                                    </button>

                                    {/* open add new character */}
                                    <button
                                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                      onClick={() => {
                                        addNewcharacter();
                                        setShowSettingsMenu(false);
                                      }}
                                    >
                                      Add character
                                    </button>

                                    {/* delete the current book */}
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
                            </div>
                            
                            {/* quick details */}
                            <div className="flex justify-between mb-1">
                              <label className="text-xs text-neutral-400">
                                Volume {bookVolume || "0"} • {bookVolName || "Volume Name"} • {upcaseLetter(bookStatus) || "unknown"}
                              </label>
                              
                              <label className="text-xs text-neutral-400">{"Chapter count: " + bookChapterCount || "add chapter count"}</label>
                            </div>

                            <textarea
                                rows={12}
                                className={`${showBookContent ? "hidden" : ""} font-serif text-sm leading-6 w-full px-1 py-1 focus:outline-none text-sm placeholder-gray-400 dark:placeholder-gray-600 text-area-scroll transition-all duration-300 resize-none`}
                                placeholder="Update book summary"
                                value={bookSummary}
                                onFocus={(e) => autoResize(e)}
                                onBlur={(e) => { e.currentTarget.style.height = "auto";}}
                                readOnly
                            />
                          </div>
                      </div>
                    </div>

                    {/* CHARACTER GENRE AND TAGS */}
                    {!showBookContent && (
                      <div className="rounded-md shadow-lg p-4 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300">
                        <label className="text-sm font-semibold">Book Classification</label>

                        <div className="block mb-1 -mt-1">
                          <label className="text-xs text-blue-900 dark:text-blue-400">Genre</label>
                          <label className="text-xs text-gray-300"> • </label>
                          <label className="text-xs text-purple-900 dark:text-purple-400">Tags</label>
                        </div>
                        
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
                                {upcaseLetter(chip.text)}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">No data yet.</span>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            
            </div>

            {/* display pinned notes */}
            <div className="hidden xxs:flex flex-col xxs:sticky xxs:top-13 h-fit w-full rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-2 xxs:mb-4 bg-white dark:bg-gray-900 transition-all duration-300">
              
              <div className="flex items-center justify-between gap-1 mb-2 border-b border-gray-100 dark:border-gray-800">
                
                <label className="text-sm font-semibold">
                  <span className="text-yellow-600 text-lg px-1">★
                  </span>
                  Pinned Notes
                </label>

                <button onClick={() => setShowPinnedNotes(prev => !prev)}> <FontAwesomeIcon icon={showPinnedNotes ? faMinus : faPlus}/> </button>
              </div>

              {showPinnedNotes && (
                <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-7rem)] pr-1 notes-scroll">
                  {bookNotes.filter(note => note.pinned).length > 0 ? (
                    bookNotes
                      .filter(note => note.pinned)
                      .map(notes => (
                        <div 
                          className={`${colorMap[notes.color] || 'bg-gray-50 dark:bg-gray-800'} relative p-2 rounded-lg border border-transparent hover:border-yellow-400/50 shadow-sm transition-all animate-fadeDown`}
                          key={notes.id ?? notes.notesId}
                        >
                          {/* Header: Star & Date */}
                          <div className="flex items-center mb-1"> 
                            <div className="flex items-center gap-1">
                              <button 
                                onMouseDown={() => {
                                  togglePin(notes);
                                }}
                                className="transition-transform hover:scale-110"
                              >
                                <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-sm" />
                              </button>

                              <span className="text-xs text-gray-800 dark:text-gray-400">
                                  {new Date(notes.createdAt).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Note Content */}
                          <textarea
                            value={notes.content}
                            rows={3}
                            readOnly // Pinned notes are often for reference; make editable on focus if needed
                            onFocus={(e) => {
                              autoResize(e); 
                              setOnFocusId(String(notes.id!)); 
                              setNoteContent(notes.content); 
                              setHideSave(true);
                            }}
                            className="
                              notes-scroll w-full text-sm bg-transparent border-none rounded-md
                              focus:outline-none
                              resize-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                            placeholder="Note content..."
                          />
                        </div>
                      ))
                  ) : (
                    <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                      <p className="text-xs text-gray-400 italic">No pinned notes yet</p>
                    </div>
                  )}
                </div>
              )}

            </div>

        </div>
        
        {/* CENTER CONTAINER */}
        <div className="col-span-1 xxs:col-span-8 xl:col-span-4 w-full flex-1">

          {/* character data and grid display */}
          <div className="rounded-md shadow-lg p-4 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300">
            {/* CHARACTER DATA COMPLETION PROGRESS BAR */}
            <div className="mb-3">
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

            {/* CHARACTER GRID TITLE */}
            <div>
              <h3 className="font-semibold mb-1">Character Grid</h3>

              {/* DISPLAY IF CHARACTERS ARE NONE */}
              {character.length === 0 && (
              <div className="w-full flex justify-center items-center py-20"> 
                  <h1 className="text-3xl font-bold text-gray-400 text-center"> 
                  PLEASE ADD SOME CHARACTERS. IT GETS LONELY SOMETIMES HERE... 
                  </h1> 
              </div>
              )}
              
              {/* Display Character Card Block */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-1 p-1">
                  {currentCharacters.map(char => (

                  // CHARACTER CARDS w/ image... //
                  <div 
                    key={char.id} 
                    title="Open character sheet."
                    className="
                      flex flex-col items-center justify-center p-2
                      cursor-pointer bg-white dark:bg-gray-950 shadow-md rounded-2xl
                      transition-all duration-300
                      hover:bg-gray-50 dark:hover:bg-gray-900 hover:shadow-xl hover:-translate-y-1
                      group animate-fadeDown border border-gray-100 dark:border-gray-800
                    "
                    onClick={() => openEditCharacter(char)}
                  >
                    {/* IMAGE: Responsive size (smaller on mobile, bigger on tablet+) */}
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-full border-2 border-white dark:border-gray-800 shadow-sm ring-2 ring-gray-100 dark:ring-gray-900">
                      <img 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        src={imageMap[char.id]?.find(img => img.isDisplayed)?.url || imageMap[char.id]?.[0]?.url || char_image}
                        alt={char.name} 
                      />
                    </div>

                    {/* TEXT CONTENT */}
                    <div className="mt-3 flex flex-col items-center w-full text-center"> 
                      <h3 className="text-xs sm:text-sm font-bold tracking-tight line-clamp-1 text-gray-900 dark:text-gray-100">
                        {char.name}
                      </h3>
                      
                      <div className="items-center justify-center gap-1 mt-1 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                        <span className="line-clamp-2">{char.role || "Unknown"}</span>
                        <span className={char.status === 'alive' ? 'text-green-600' : 'text-red-700'}>
                          {upcaseLetter(char.status)} 
                        </span>
                      </div>
                    </div>
                  </div>
                  ))}
              </div>

              {/* // PAGINATION   */}
              {character.length >= 15 && (
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
                          <span>-</span>
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
                          <span>-</span>
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

          {/* WORLD BUILDING DETAILS */}
          <div className="rounded-md shadow-lg p-4 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="text-sm font-semibold">World Setting</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your story's facts and lore references</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {worldbuildingSections.map(section => (
                <div key={section.id} className="rounded border border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-left"
                    onClick={() => toggleWorldSection(section.id)}
                  >
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{section.title}</span>
                    <span className="text-sm font-bold">{openWorldSections[section.id] ? "−" : "+"}</span>
                  </button>

                  {openWorldSections[section.id] && (
                    <dl className="px-3 pb-3 space-y-2">
                      {section.entries.map((entry, index) => (
                        <div key={`${section.id}-${entry.label}-${index}`}>
                          <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{entry.label}</dt>
                          <dd className="text-sm text-gray-700 dark:text-gray-200">{entry.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ))}
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
        <div className="fixed top-14 z-30 left-1/2 bg-gray-300 py-1 px-5 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
            <span>
            {alertMessage}
            <FontAwesomeIcon className="text-green-500" size="lg" icon={faCheck}/>
            </span>
        </div>
        )}

        {/* NOTES */}
        {createPortal(
          <>
            {/* MOBILE NOTES TOGGLE */}
            <button
              ref={notesFabRef}
              onClick={displayNotes}
              className={`
                fixed bottom-5 right-5 z-50
                bg-blue-600 hover:bg-blue-700
                border border-blue-600 hover:border-blue-400
                text-white rounded-full
                px-4 py-3.5 shadow-xl
                transition-transform duration-300 
                ${isNotesDrawerClosing ? "rotate-[1200deg] transition-all duration-700 ease-in scale-115 bg-gray-900 hover:bg-gray-900 border-gray-800 hover:border-gray-800 shadow-4xl" : "scale-100"}
              `}
              title={notesShowState ? "Close notes" : "Open notes"}
            >
              <FontAwesomeIcon icon={notesShowState ? faMinus : faPlus} className={`${isNotesDrawerClosing ? "scale-400 text-gray-700" : "scale-100"}`}/>
            </button>

            {/* Collapsible notes drawer*/}
            {isNotesDrawerMounted && (
              <div
                className={`text-black dark:text-white fixed inset-0 z-40 transition-opacity duration-300 justify-items-center ${isNotesDrawerVisible ? "opacity-100" : "opacity-0"}`}
                role="dialog"
                aria-modal="true"
              >
                <button
                  className="absolute inset-0 bg-black/50"
                  aria-label="Close notes drawer"
                  onClick={closeNotesDrawer}
                />

                {/* notes content */}
                <div
                  ref={notesDrawerPanelRef}
                  className={`
                    absolute bottom-0 xxs:bottom-15 xxs:right-15
                    bg-gray-100 dark:bg-gray-800
                    shadow-2xl p-3
                    w-full max-w-[60vh] max-h-[80vh]
                    transition-all duration-800
                    ease-[cubic-bezier(0.22,1,0.36,1)]
                    origin-center
                    will-change-transform
                    ${isNotesDrawerVisible ? "opacity-100 rounded-xl scale-100" : ""}
                    ${isNotesDrawerClosing ? "opacity-0 rounded-full" : ""}
                  `}
                  style={{
                    transform: isNotesDrawerVisible
                      ? "translate3d(0,0,0) scale(1)"
                      : isNotesDrawerClosing
                      ? notesDrawerCloseTransform
                      : "translate3d(0,120%,0) scale(0.9)"
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold">Notes</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={addDraftNotes}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                      >
                        Add
                      </button>
                      <button
                        onClick={closeNotesDrawer}
                        className="text-xs bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-md"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="h-[calc(75vh-3.5rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain mt-2">
                    {bookNotes.length < 1 && !draftNote && (
                      <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-500 rounded-xl">
                        <p className="text-xs text-gray-300 italic">Add notes, references, future scenarios, book plans, etc...</p>
                      </div>
                    )}

                    {/* // THIS IS THE BOOK NOTES */}
                    <div>
                        {[ ...(draftNote ? [draftNote] : []), ...bookNotes ].map(notes => (
                          <div 
                              className={`${colorMap[notes.color]} relative p-1 rounded-md shadow-md mb-2 bg-gray-100 dark:bg-gray-900 cursor-pointer animate-fadeDown`}
                              key={notes.id ?? notes.notesId}
                              data-id={notes.id}
                          >

                              <div className="flex justify-between pb-1"> 
                              
                              <div className="flex items-center gap-1">
                                {notes.id && (
                                  <span> 
                                    <FontAwesomeIcon icon={faStar} 
                                      className={`${notes.pinned ? "text-yellow-400" : "text-gray-500"} hover:text-yellow-500 transition-transform hover:scale-110`}
                                      onMouseDown={() => {
                                        togglePin(notes);
                                      }}
                                    /> 
                                  </span>
                                )}

                                <span className="text-xs text-gray-800 dark:text-gray-400">
                                    {new Date(notes.createdAt).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    })}
                                </span>
                              </div>

                              <button 
                                className="rounded-full items-center px-0.5 group"
                                onMouseDown={() => setNoteToDelete(notes)}
                                disabled={!notes.id || notes.pinned === true}
                              >
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
                              onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                                const target = e.currentTarget;
                                target.style.height = '';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                              className="
                              w-full text-sm
                              rounded-md 
                              px-1
                              focus:outline-none focus:ring-1 focus:ring-gray-400 
                              hover:ring-gray-400 hover:ring-1
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

                                  <button 
                                  className="flex px-4 py-1 bg-neutral-500 rounded-xl hover:bg-neutral-600"
                                  onMouseDown={() => {setHideSave(false); setDraftNote(null);}}
                                  >
                                  Cancel
                                  </button>

                                  <button 
                                  className="flex px-4 py-1 bg-blue-700 rounded-xl"
                                  onMouseDown={() => {saveNote(notes);}}
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

                {/* notes content closer   */}
                </div>

              {/* notes closer */}
              </div>
            )}
          </>,
          document.body
        )}

        {/* WORLD BUILDING INPUT MODAL */}
        {showWorldbuildingModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowWorldbuildingModal(false);
              }
            }}
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md bg-white dark:bg-gray-900 p-4 shadow-2xl notes-scroll" onMouseDown={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Add Worldbuilding Section</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Add a title, then as many label/value facts as you need.</p>
                </div>
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setShowWorldbuildingModal(false)}
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">Section Title</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 bg-transparent"
                    placeholder="ex: Economy, Politics, Religion..."
                    value={worldSectionTitle}
                    onChange={(e) => setWorldSectionTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Entries (Label + Value)</label>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded border border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={addWorldDraftEntry}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add entry
                    </button>
                  </div>

                  {worldDraftEntries.map((entry, index) => (
                    <div key={`draft-entry-${index}`} className="rounded border border-gray-300 dark:border-gray-700 p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Entry #{index + 1}</span>
                        <button
                          type="button"
                          className="text-xs text-red-500 disabled:opacity-40"
                          onClick={() => removeWorldDraftEntry(index)}
                          disabled={worldDraftEntries.length === 1}
                        >
                          Remove
                        </button>
                      </div>

                      <input
                        type="text"
                        className="w-full rounded border border-gray-300 dark:border-gray-700 px-2 py-1 bg-transparent"
                        placeholder="Label (ex: Cost, Rule, Limitation)"
                        value={entry.label}
                        onChange={(e) => updateWorldDraftEntry(index, "label", e.target.value)}
                      />
                      <textarea
                        rows={2}
                        className="w-full rounded border border-gray-300 dark:border-gray-700 px-2 py-1 bg-transparent"
                        placeholder="Value / detail"
                        value={entry.value}
                        onChange={(e) => updateWorldDraftEntry(index, "value", e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-gray-500 text-white hover:bg-gray-600"
                    onClick={() => setShowWorldbuildingModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={saveWorldbuildingSection}
                  >
                    Save Section
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          

    {/* MAIN PARENT CONTAINER DIV CLOSER */}
    </div>

  );
}
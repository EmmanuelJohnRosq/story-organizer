import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import Navbar, { type NavbarAction } from "../components/Navbar";

import { db, type Book, type Character, type EditableCharacter, type Notes, type CharacterDescription, type CharImage, type WorldbuildingSection, type WorldbuildingEntry } from "../db";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faCheck, faPlus, faMinus, faEllipsis, faUserPlus, faTableColumns, faWandMagicSparkles, faProjectDiagram, faGlobe, faPenToSquare, faFileLines, faHouse, faStar, faPen, faArrowLeft, faUpload } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";

import NotesCollection, { type EditableNote } from "../components/NotesCollection";
import getCroppedImg from "../components/cropImage";

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
        loadBookWorldSettings(currentBookId);
        loadBookCover(currentBookId);
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

    const characterPriority = {
      0: "None",
      1: "Low",
      2: "Occasional",
      3: "Regular",
      4: "Frequent",
      5: "Current"
    };
  
    // FUNCTION ON START - CONNETION TO DB
    const loadChars = async (bookId : string) => {
      const characters = await db.characters
        .where("bookId")
        .equals(bookId)
        .toArray();
  
      characters.sort((a, b) => {
        const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        return a.id - b.id;
      });
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

    const loadBookWorldSettings = async (bookId: string) => {
      const setting = await db.worldSetting
        .where("bookId")
        .equals(bookId)
        .toArray();

      setting.sort((a, b) => {
        const getTimestamp = (id: string) => parseInt(id.split('-').pop() || '0');
        return getTimestamp(a.id) - getTimestamp(b.id);
      });
      setWorldbuildingSections(setting);
    };
  
    function normalizeWhitespace(text: string) {
      return text
        .trim()                // remove start/end spaces
        .replace(/\s+/g, " "); // collapse multiple spaces into one
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
      goToTop();
  
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
        priority: 0,
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
    async function saveBookDetails(event: React.SubmitEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!currentBookId) return;
      goToTop();

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

      if (draftBookCoverFile) {
        const existing = await db.images.where("bookId").equals(currentBookId).toArray();
        await Promise.all(existing.map(image => db.images.update(image.imageId, { isDisplayed: false })));

        await db.images.add({
          imageId: crypto.randomUUID(),
          charId: 0,
          bookId: currentBookId,
          createdAt: Date.now(),
          imageBlob: draftBookCoverFile,
          isDisplayed: true,
        });

        await loadBookCover(currentBookId);
        setDraftBookCoverFile(null);
        setBookCoverDraftUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }

      setCurrentBook(prev => (prev ? { ...prev, ...updatedBook } : prev));

      setAlert("Changes Saved");
      setStatePopup(true);
      setTimeout(() => { setStatePopup(false); setAlert(""); }, 2000);
      resetBookCoverCropState();
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

      resetBookCoverCropState();
      setDraftBookCoverFile(null);
      setBookCoverDraftUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      if (currentBook?.id) {
        void loadBookCover(currentBook.id);
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
    const [char_image] = useState("/textures/char_images/default_char.jpg");
    const bookCoverInputRef = useRef<HTMLInputElement | null>(null);

    const loadBookCover = async (bookId: string) => {
      const images = await db.images
        .where("bookId")
        .equals(bookId)
        .toArray();

      images.sort((a, b) => b.createdAt - a.createdAt);
      const selected = images.find(img => img.isDisplayed) ?? images[0];

      setBookCoverUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return selected ? URL.createObjectURL(selected.imageBlob) : null;
      });
    };

    function resetBookCoverCropState() {
      setBookCoverImageSrc(null);
      setBookCoverCrop({ x: 0, y: 0 });
      setBookCoverZoom(1);
      setBookCoverCroppedAreaPixels(null);
      setShowBookCoverCropper(false);

      if (bookCoverInputRef.current) {
        bookCoverInputRef.current.value = "";
      }
    }

    const uploadBookCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;

      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;

        if (typeof result !== "string") {
          alert("Could not read that image file.");
          return;
        }

        setBookCoverImageSrc(result);
        setBookCoverCrop({ x: 0, y: 0 });
        setBookCoverZoom(1);
        setBookCoverCroppedAreaPixels(null);
        setShowBookCoverCropper(true);
      };
      reader.readAsDataURL(file);
    };

    const onBookCoverCropComplete = (_croppedArea: Area, croppedPixels: Area) => {
      setBookCoverCroppedAreaPixels(croppedPixels);
    };

    const handleBookCoverCropSave = async () => {
      if (!bookCoverImageSrc || !bookCoverCroppedAreaPixels) return;

      try {
        const croppedFile = await getCroppedImg(
          bookCoverImageSrc,
          bookCoverCroppedAreaPixels,
          `${normalizeWhitespace(titleDraft || currentBook?.title || "book-cover") || "book-cover"}.jpg`,
        );

        setDraftBookCoverFile(croppedFile);

        setBookCoverDraftUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(croppedFile);
        });

        resetBookCoverCropState();
      } catch (error) {
        console.error("Failed to crop book cover", error);
        alert("We couldn't crop that image. Please try another image.");
      }
    };

  
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
    const [draftNote, setDraftNote] = useState<EditableNote | null>(null);
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
    const [bookCoverUrl, setBookCoverUrl] = useState<string | null>(null);

    const [draftBookCoverFile, setDraftBookCoverFile] = useState<File | null>(null);
    const [bookCoverDraftUrl, setBookCoverDraftUrl] = useState<string | null>(null);
    const [bookCoverImageSrc, setBookCoverImageSrc] = useState<string | null>(null);
    const [bookCoverCrop, setBookCoverCrop] = useState<Point>({ x: 0, y: 0 });
    const [bookCoverZoom, setBookCoverZoom] = useState(1);
    const [bookCoverCroppedAreaPixels, setBookCoverCroppedAreaPixels] = useState<Area | null>(null);
    const [showBookCoverCropper, setShowBookCoverCropper] = useState(false);

    const [showPinnedNotes, setShowPinnedNotes] = useState(true);
 
    const [isNotesDrawerMounted, setIsNotesDrawerMounted] = useState(false);
    const [isNotesDrawerVisible, setIsNotesDrawerVisible] = useState(false);

    const [showBookContent, setShowBookContent] = useState(false);

    const notesFabRef = useRef<HTMLButtonElement | null>(null);
    const notesDrawerPanelRef = useRef<HTMLDivElement | null>(null);
  
    // SHOW/HIDE ADD CHARACTER FORM
    const addNewcharacter = () => {
      if (addCharacterState === false) {
        goToTop();
      };
      setAddCharState(!addCharacterState);
      setEditBookContent(false);
    };

    // SHOW/HIDE EDIT CONTENT FORM
    const editBook = () => {
      if (editBookContent === false) {
        goToTop();
      };
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
      addDraftNotes();

      requestAnimationFrame(() => {
        setIsNotesDrawerVisible(true);
      });
    };

    const closeNotesDrawer = () => {
      setIsNotesDrawerVisible(false);
      setNotesShowState(false);
      setDraftNote(null)

      notesDrawerTimeoutRef.current = window.setTimeout(() => {
        setIsNotesDrawerMounted(false);
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

    const updateCharacterPriority = async (charId: number, currentPriority: number) => {
      const promptValue = String(currentPriority ?? 0);

      if (promptValue === null) return;

      const parsedPriority = Number(promptValue.trim());
      if (!Number.isFinite(parsedPriority) || parsedPriority < 0) {
        window.alert("Please enter a valid priority number (0 or higher).");
        return;
      }

      const nextPriority = Math.floor(parsedPriority);

      await db.characters.update(charId, { priority: nextPriority });
      setCharacters(prev => {
        const updated = prev.map(char => (
          char.id === charId ? { ...char, priority: nextPriority } : char
        ));

        return updated.sort((a, b) => {
          const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
          if (priorityDiff !== 0) return priorityDiff;
          return a.id - b.id;
        });
      });
    };
  
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

    const [worldbuildingSections, setWorldbuildingSections] = useState<WorldbuildingSection[]>([]);
    const [showWorldbuildingModal, setShowWorldbuildingModal] = useState(false);
    const [worldSectionTitle, setWorldSectionTitle] = useState("");
    const [showWorldAtlas, setShowWorldAtlas] = useState(false);
    const [isWorldAtlasMounted, setIsWorldAtlasMounted] = useState(false);
    const [isWorldAtlasVisible, setIsWorldAtlasVisible] = useState(false);
    const [worldDraftEntries, setWorldDraftEntries] = useState<WorldbuildingEntry[]>([{ label: "", value: "" }]);

    const [showEditWorldbuildingModal, setShowEditWorldbuildingModal] = useState(false);
    const [selectedWorldSectionId, setSelectedWorldSectionId] = useState<string | null>(null);
    const [editWorldSectionTitle, setEditWorldSectionTitle] = useState("");
    const [editWorldDraftEntries, setEditWorldDraftEntries] = useState<WorldbuildingEntry[]>([{ label: "", value: "" }]);
    const [activeWorldSectionId, setActiveWorldSectionId] = useState<string | null>(null);

    const [openWorldSections, setOpenWorldSections] = useState<Record<string, boolean>>({});
    const [priority ,setPriority] = useState<number | null>(null);

    useEffect(() => {
      const initial: Record<string, boolean> = {};
      worldbuildingSections.forEach(s => initial[s.id] = true);
      setOpenWorldSections(initial);
    }, [worldbuildingSections]);

    useEffect(() => {
      if (!worldbuildingSections.length) {
        setActiveWorldSectionId(null);
        return;
      }

      setActiveWorldSectionId(prev =>
        prev && worldbuildingSections.some(section => section.id === prev)
          ? prev
          : worldbuildingSections[0].id
      );
    }, [worldbuildingSections]);

    useEffect(() => {
      const shouldLockBody = showWorldbuildingModal || showEditWorldbuildingModal || showWorldAtlas;
      document.body.classList.toggle('overflow-hidden', shouldLockBody);

      return () => {
        document.body.classList.toggle('overflow-hidden', false);
      };
    }, [showWorldbuildingModal, showEditWorldbuildingModal, showWorldAtlas]);

    useEffect(() => {
      let closeTimeoutId: number | undefined;

      if (showWorldAtlas) {
        setIsWorldAtlasMounted(true);
      } else if (isWorldAtlasMounted) {
        setIsWorldAtlasVisible(false);
        closeTimeoutId = window.setTimeout(() => {
          setIsWorldAtlasMounted(false);
        }, 320);
      }

      return () => {
        if (closeTimeoutId) {
          window.clearTimeout(closeTimeoutId);
        }
      };
    }, [showWorldAtlas, isWorldAtlasMounted]);

    useEffect(() => {
      if (!isWorldAtlasMounted || !showWorldAtlas) {
        return;
      }

      const openTimeoutId = window.setTimeout(() => {
        setIsWorldAtlasVisible(true);
      }, 20);

      return () => {
        window.clearTimeout(openTimeoutId);
      };
    }, [isWorldAtlasMounted, showWorldAtlas]);

    const activeWorldSection = worldbuildingSections.find(section => section.id === activeWorldSectionId) ?? null;

    const openWorldAtlas = () => {
      setShowWorldAtlas(true);
      setShowSettingsMenu(false);
    };

    const closeWorldAtlas = () => {
      setShowWorldAtlas(false);
    };

    const openWorldbuildingModal = () => {
      setWorldSectionTitle("");
      setShowWorldbuildingModal(true);
      setWorldDraftEntries([{ label: "", value: "" }]);
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

    const closeEditWorldbuildingModal = () => {
      setShowEditWorldbuildingModal(false);
      setSelectedWorldSectionId(null);
      setEditWorldSectionTitle("");
      setEditWorldDraftEntries([{ label: "", value: "" }]);
    };

    const openEditWorldbuildingModal = () => {
      if (worldbuildingSections.length < 1) return;

      setShowEditWorldbuildingModal(true);
      setShowSettingsMenu(false);
    };

    const addEditWorldDraftEntry = () => {
      setEditWorldDraftEntries(prev => [...prev, { label: "", value: "" }]);
    };

    const updateEditWorldDraftEntry = (index: number, key: "label" | "value", newValue: string) => {
      setEditWorldDraftEntries(prev => prev.map((entry, i) => (
        i === index ? { ...entry, [key]: newValue } : entry
      )));
    };

    const removeEditWorldDraftEntry = (index: number) => {
      setEditWorldDraftEntries(prev => {
        if (prev.length === 1) return prev;
        return prev.filter((_, i) => i !== index);
      });
    };

    const selectWorldSectionForEdit = (sectionId: string) => {
      const section = worldbuildingSections.find(item => item.id === sectionId);
      if (!section) return;

      setSelectedWorldSectionId(section.id);
      setEditWorldSectionTitle(section.title);
      setEditWorldDraftEntries(section.entries.length ? section.entries.map(entry => ({ ...entry })) : [{ label: "", value: "" }]);
    };

    const saveWorldbuildingSection = async (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();

      const normalizedTitle = normalizeWhitespace(worldSectionTitle);
      const cleanEntries = worldDraftEntries
        .map(entry => ({
          label: normalizeWhitespace(entry.label),
          value: entry.value.trim().replace(/\s+/g, " "),
        }))
        .filter(entry => entry.label && entry.value);

      if (!normalizedTitle) {
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
      setActiveWorldSectionId(sectionId);
      setShowWorldbuildingModal(false);

      setWorldDraftEntries([{ label: "", value: "" }]);
    };

    const saveEditedWorldbuildingSection = async (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedWorldSectionId) {
        return;
      }

      const normalizedTitle = normalizeWhitespace(editWorldSectionTitle);
      const cleanEntries = editWorldDraftEntries
        .map(entry => ({
          label: normalizeWhitespace(entry.label),
          value: entry.value.trim().replace(/\s+/g, " "),
        }))
        .filter(entry => entry.label && entry.value);

      if (!normalizedTitle) {
        return;
      }

      const updatedSection = worldbuildingSections.find(section => section.id === selectedWorldSectionId);
      if (!updatedSection) {
        return;
      }

      const nextSection = {
        ...updatedSection,
        title: normalizedTitle,
        entries: cleanEntries,
      };

      await db.worldSetting.put(nextSection);
      setWorldbuildingSections(prev => prev.map(section => section.id === selectedWorldSectionId ? nextSection : section));
      setActiveWorldSectionId(nextSection.id);
      closeEditWorldbuildingModal();
    };

    const deleteWorldbuildingSection = async (sectionId: string) => {
      const isConfirmed = window.confirm("Delete this worldbuilding section?");
      if (!isConfirmed) return;

      const remainingSections = worldbuildingSections.filter(section => section.id !== sectionId);

      await db.worldSetting.delete(sectionId);
      setWorldbuildingSections(remainingSections);
      setOpenWorldSections(prev => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });

      if (remainingSections.length > 0) {
        setSelectedWorldSectionId(null);
      } else {
        closeEditWorldbuildingModal();
      }
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
        onClick: () => showWorldAtlas ? closeWorldAtlas() : openWorldAtlas(),
        isActive: showWorldAtlas,
        title: "Open world atlas",
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

    useEffect(() => {
      return () => {
        if (bookCoverUrl) URL.revokeObjectURL(bookCoverUrl);
        if (bookCoverDraftUrl) URL.revokeObjectURL(bookCoverDraftUrl);
      };
    }, [bookCoverUrl, bookCoverDraftUrl]);

    const goToTop = () => {
      window.scrollTo({
        top: 100,
        behavior: 'smooth', // 'smooth' for animation, 'auto' for instant jump
      });
    };

    const activeBookStatus = upcaseLetter(bookStatus || currentBook?.status || "ongoing");
    const highlightedCharacterCount = character.filter(char => (char.priority ?? 0) > 0).length;
    const pinnedNotesCount = bookNotes.filter(note => note.pinned).length;
    const statusTone =
      bookStatus === "completed"
        ? "from-emerald-500 to-cyan-500"
        : bookStatus === "hiatus"
          ? "from-amber-500 to-orange-500"
          : bookStatus === "dropped"
            ? "from-rose-500 to-pink-500"
            : "from-indigo-700 to-cyan-700";

  return (
    // MAIN PARENT CONTAINER DIV CLOSER
    <div className="mx-auto w-full max-w-7xl px-3 pb-6 pt-2 xxs:pl-20 xxs:px-6">
      <Navbar actions={navbarActions} />

      {/* CONTENT CONTAINER */}
      <div className="mt-12 space-y-3 xxs:mt-13">

        {/* hero section card */}
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
            <div className={`relative overflow-hidden bg-gradient-to-br ${statusTone} p-6 text-white sm:p-8`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_28%)]" />
              <div className="relative">
                
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 mt-1">
                    <h2 className="text-xl font-semibold uppercase tracking-[0.35em] text-white/70">Story workshop</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to library
                  </button>
                </div>

                <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
                  Keep your book profile, cast, and lore aligned in one polished workspace.
                </p>

                <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">{activeBookStatus}</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">Volume {bookVolume || currentBook?.volume || 0}</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">{bookChapterCount || 0} Chapters</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:grid grid-cols-2 gap-3 bg-gray-50 p-4 dark:bg-gray-950/60 sm:p-2">
              {[
                { label: "Characters", value: character.length },
                { label: "Highlighted", value: highlightedCharacterCount },
                { label: "Pinned notes", value: pinnedNotesCount },
                { label: "Lore sections", value: worldbuildingSections.length },
              ].map(stat => (
                <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-gray-400">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-3 xxs:grid-cols-[1.2fr_1.5fr]">
          {/* LEFT SIDE CONTAINER */}
          <div className="flex-1 space-y-2">

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
                            className="rounded-2xl border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
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
                              className="rounded-2xl border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
                              placeholder="e.g. 1"
                              value={bookVolume}
                              onChange={e => setBookVolume(e.target.value)}
                              required
                            />
                          </div> 

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Volume Name</label>
                            <input
                              className="rounded-2xl border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
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
                              className="rounded-2xl border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none cursor-pointer"
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
                              className="rounded-2xl border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
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
                            className="rounded-2xl border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition resize-y notes-scroll"
                            placeholder="Write book summary"
                            value={bookSummary}
                            onChange={e => setBookSummary(e.target.value)}
                          />
                        </div>

                        {/* Genre check list */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Genre</label>
                          <div className="grid grid-cols-2 gap-x-10 gap-y-1 overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 p-3">
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
                            className="rounded-2xl border border-gray-300 dark:border-gray-700 p-2.5 dark:bg-gray-800 w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
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

                        {/* upload book cover */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 ml-1">Book Cover</label>
                          <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <FontAwesomeIcon icon={faUpload} />
                            <span>{draftBookCoverFile ? draftBookCoverFile.name : "Upload new book cover"}</span>
                            <input
                              ref={bookCoverInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={uploadBookCover}
                            />
                          </label>

                          {(bookCoverDraftUrl || bookCoverUrl) && (
                            <div className="mt-3 rounded-2xl place-items-center">
                              <div className="h-60 w-45 overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img
                                  src={bookCoverDraftUrl || bookCoverUrl || undefined}
                                  alt={`${currentBook?.title || "Book"} cover preview`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </div>
                          )}

                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Choose the exact part of the image you want displayed on your book cards before saving.
                          </p>
                        </div>

                      </div>

                      <button
                        type="submit"
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all active:scale-95"
                      >
                        Save book details
                      </button>

                      <button
                        type="button"
                        className="w-full my-3 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-gray-700/30 transform transition-all5"
                        onClick={cancelBookDetailsEdit}
                      >
                        Cancel
                      </button>

                    </form>
                  )}

                  {/* BOOK SUMMARY FORM */}
                  {!editBookContent && (
                    <div className="flex flex-col">
                      <div className="rounded-3xl border border-gray-200 bg-white px-4 pb-4 pt-4 shadow-lg dark:border-gray-800 dark:bg-gray-900 transition duration-300 animate-fadeDown">
                        <div className="space-y-2">

                            {/* Summary */}
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs uppercase tracking-[0.28em] text-indigo-500">Book profile</p>
                                </div>
                                  
                                <div className="relative inline-block"> 
                                  <button
                                    className="flex px-2 items-center justify-center rounded-2xl border border-gray-300 text-black transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                    onClick={() => setShowSettingsMenu(prev => !prev)}
                                    title="Book settings"
                                  >
                                    <FontAwesomeIcon icon={faEllipsis} size="lg"/>
                                  </button>

                                  {showSettingsMenu && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-20 cursor-default" 
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevents clicking the backdrop from triggering the Card
                                        setShowSettingsMenu(false);
                                      }}
                                    />
                                  
                                    <div className="absolute top-9 right-1 z-30 w-56 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-600 shadow-xl p-2 space-y-1">
                                      
                                      {/* minimize book details */}
                                      <button
                                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                        onClick={() => {
                                          setShowBookContent(prev => !prev);
                                          setShowSettingsMenu(false);
                                        }}
                                      >
                                        {showBookContent ? "Expand synopsis panel" : "Compact synopsis panel"}
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
                                  </>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2 flex">
                                <label className="block truncate text-2xl font-black">
                                  {titleDraft || currentBook?.title || "Book Content"}
                                </label>
                              </div>
                              
                              {/* quick details */}
                              <div className="mt-2 grid grid-cols-2 gap-2 shadow-sm">
                                {/* Volume Box */}
                                <div className="flex flex-col gap-1 rounded-xl bg-gray-50 p-2 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                    Format
                                  </span>
                                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                                    Volume {bookVolume || "0"}
                                  </span>
                                </div>

                                {/* Name Box */}
                                <div className="flex flex-col gap-1 rounded-xl bg-gray-50 p-2 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                    Series Name
                                  </span>
                                  <span className="truncate text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                                    {bookVolName || "Main Story"}
                                  </span>
                                </div>

                                {/* Status Box */}
                                <div className="flex flex-col gap-1 rounded-xl bg-gray-50 p-2 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                    Book Status
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                                      {upcaseLetter(bookStatus) || "Unknown"}
                                    </span>
                                  </div>
                                </div>

                                {/* Chapter Box */}
                                <div className="flex flex-col gap-1 rounded-xl bg-gray-50 p-2 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                    Count
                                  </span>
                                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                                    {bookChapterCount ? `${bookChapterCount} Chapters` : "Count Pending"}
                                  </span>
                                </div>
                              </div>

                              <textarea
                                rows={bookSummary ? 12 : 1}
                                className={`${showBookContent ? "hidden" : ""} mt-4 min-h-[180px] w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 font-serif text-sm leading-7 text-gray-700 transition-all duration-300 placeholder:text-center placeholder:text-lg placeholder-gray-400 focus:outline-none dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-200 dark:placeholder-gray-600 text-area-scroll resize-none`}
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
                        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900 transition duration-300">
                          <label className="text-sm font-semibold">Book Classification</label>

                          <div className="mb-1 mt-1 block">
                            <label className="text-xs uppercase tracking-[0.22em] text-blue-900 dark:text-blue-400">Genre</label>
                            <label className="text-xs text-gray-300"> • </label>
                            <label className="text-xs uppercase tracking-[0.22em] text-purple-900 dark:text-purple-400">Tags</label>
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
              <div className="hidden h-fit w-full flex-col rounded-3xl border border-gray-200 bg-white p-3 shadow-lg transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 xxs:sticky xxs:top-13 xxs:flex">
              
                <div className="mb-2 flex items-center justify-between gap-1 border-b border-gray-100 px-2 pb-2 dark:border-gray-800">
                  
                  <label className="text-sm font-semibold">
                    <span className="text-yellow-600 text-lg">★
                    </span>
                    Pinned Notes
                  </label>

                  <button onClick={() => setShowPinnedNotes(prev => !prev)} className="text-gray-500 hover:text-white"> <FontAwesomeIcon icon={showPinnedNotes ? faMinus : faPlus}/> </button>
                </div>

                {showPinnedNotes && (
                  <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)] pr-1 notes-scroll">
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
          <div className="w-full flex-1 space-y-2">

            {/* character data and grid display */}
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg transition duration-300 dark:border-gray-800 dark:bg-gray-900">
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
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Character Grid</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">A cleaner cast overview inspired by the updated library cards.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addNewcharacter}
                    className="inline-flex items-center gap-2 self-start rounded-2xl bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-300"
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                    Add character
                  </button>
                </div>

                {/* DISPLAY IF CHARACTERS ARE NONE */}
                {character.length === 0 && (
                  <div className="flex w-full items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-indigo-50 px-8 py-20 text-center dark:border-gray-700 dark:from-gray-900 dark:to-indigo-950/20"> 
                    <h1 className="max-w-xl text-3xl font-bold text-gray-400">  
                      PLEASE ADD SOME CHARACTERS. IT GETS LONELY SOMETIMES HERE... 
                      </h1> 
                  </div>
                )}
                
                {/* Display Character Card Block */}
                <div className="grid grid-cols-2 gap-3 p-1 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4">
                    {currentCharacters.map(char => (

                    // CHARACTER CARDS w/ image... //
                    <div 
                      key={char.id} 
                      title="Open character sheet."
                      className="group relative flex cursor-pointer flex-col 
                      items-center justify-center rounded-[28px] border border-gray-200 
                      bg-white p-3 shadow-md transition-all duration-300 
                      hover:bg-gray-50 hover:shadow-2xl 
                      dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900 animate-fadeDown"
                      onClick={() => openEditCharacter(char)}
                    >
                      <div className="absolute inset-x-0 top-0 h-20 rounded-[28px]
                      bg-gradient-to-b from-indigo-100/90 via-cyan-50/60 to-transparent 
                      dark:from-indigo-900/30 dark:via-cyan-900/10 dark:to-transparent" />
                      <button
                        type="button"
                        title="Set character priority"
                        className={`absolute right-2 top-2 z-10
                          inline-flex items-center gap-1 rounded-full 
                          border px-2 py-1 text-[10px] font-semibold 
                          shadow-sm transition hover:border-amber-500 
                          ${char.priority > 0 
                            ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-200" 
                            : "border-gray-200 bg-white/90 text-gray-500 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-300"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriority(priority === char.id ? null : char.id);
                        }}
                      >
                        <FontAwesomeIcon icon={faStar} className={char.priority > 0 ? "text-amber-400" : "text-gray-400"} />
                        P{char.priority ?? 0}
                      </button>

                      {/* priority tool tip */}
                      {priority === char.id && (
                        <>
                          {/* Backdrop: stopPropagation prevents the Card click from firing */}
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              setPriority(null);
                            }}
                          />
                          
                          <div 
                            className="absolute left-12 top-10 z-20 mb-2 w-35 
                            rounded-lg bg-gray-500 p-1 shadow-xl ring-1 ring-white/10 
                            dark:bg-slate-800 animate-in fade-in zoom-in duration-200 
                            origin-bottom"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label className="text-xs text-gray-400 p-1">Select priority value:</label>
                            <div className="flex flex-col gap-0.5">
                              {Object.entries(characterPriority).map(([value, label]) => {  
                                const isSelected = char.priority === Number(value);
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    title={"Priority value: "+ value}
                                    className={`flex items-center justify-between rounded px-3 py-1.5 text-left text-[11px] transition-colors hover:bg-white/10 ${
                                      isSelected ? "text-amber-400 font-bold bg-white/5" : "text-gray-300"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateCharacterPriority(char.id, Number(value));
                                      setPriority(null); // Close after selection
                                    }}
                                  >
                                    <span>{label}</span>
                                    <span className="opacity-50">P{value}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}

                      {/* IMAGE: Responsive size (smaller on mobile, bigger on tablet+) */}
                      <div className="relative mt-6 h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm ring-4 ring-white dark:border-gray-800 dark:ring-gray-900 sm:h-24 sm:w-24">
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
                        
                        <div className="mt-1 items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-gray-500 sm:text-[10px]">
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
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 pt-2">

                    {/* Previous */}
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="rounded-xl bg-gray-200 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        Prev
                    </button>

                    <div className="flex items-center gap-2">
                        {/* First page shortcut */}
                        {currentPage > 3 && (
                        <>
                            <button
                            onClick={() => setCurrentPage(1)}
                            className="rounded-xl bg-gray-200 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
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
                            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                            currentPage === page
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
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
                            className="rounded-xl bg-gray-200 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
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
                        className="rounded-xl bg-gray-200 px-3 py-1.5 text-sm font-medium transition hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        Next
                    </button>

                    </div>
                )}
              </div>
            </div>

            {/* WORLD BUILDING DETAILS */}
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg transition duration-300 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <label className="text-sm font-semibold">World Setting</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your story's facts and lore references</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                    onClick={openEditWorldbuildingModal}
                    disabled={worldbuildingSections.length < 1}
                  >
                    <FontAwesomeIcon icon={faPen} /> Edit
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                    onClick={openWorldbuildingModal}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {worldbuildingSections.map(section => (
                  <div key={section.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-800/60">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-100/80 dark:hover:bg-gray-800"
                      onClick={() => toggleWorldSection(section.id)}
                    >
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{section.title}</span>
                      <span className="text-sm font-bold">{openWorldSections[section.id] ? "−" : "+"}</span>
                    </button>

                    {openWorldSections[section.id] && (
                      <dl className="space-y-3 border-t border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
                        {section.entries.map((entry, index) => (
                          <div key={`${section.id}-${entry.label}-${index}`} className="rounded-2xl bg-white px-3 py-3 shadow-sm dark:bg-gray-900">
                            <dt className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{entry.label}</dt>
                            <dd className="mt-1 text-sm text-gray-700 dark:text-gray-200">{entry.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                ))}

                {worldbuildingSections.length < 1 && (
                  <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                    <p className="text-xs text-gray-400 italic">No world settings yet</p>
                  </div>
                )}
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
        <div className="fixed top-14 z-50 left-1/2 bg-gray-300 py-1 px-5 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
            <span>
            {alertMessage}
            <FontAwesomeIcon className="text-green-500" size="lg" icon={faCheck}/>
            </span>
        </div>
        )}

        {/* BOOK NOTES */}
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
                transition-transform duration-600 
                ${notesShowState ? "hidden" : "none"}
              `}
              title={notesShowState ? "Close notes" : "Open notes"}
            >
              <FontAwesomeIcon icon={notesShowState ? faMinus : faPlus}/>
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
                    absolute bottom-0 xxs:right-15
                    bg-gray-100 dark:bg-gray-800
                    shadow-2xl p-3
                    w-full max-w-[60vh] max-h-[90vh]
                    transition-all duration-500
                    ${isNotesDrawerVisible ? "translate-y-0" : "translate-y-full"}
                  `}
                >

                  <NotesCollection
                    title="Notes"
                    notes={bookNotes}
                    draftNote={draftNote}
                    draftNoteState={draftNoteState}
                    noteToDelete={noteToDelete}
                    hideSave={hideSave}
                    onFocusId={onFocusId}
                    noteContent={noteContent}
                    emptyMessage="Add notes, references, future scenarios, book plans, etc..."
                    contentClassName="mt-2 h-[calc(75vh-3.5rem)] xxs:h-[calc(85vh-3.5rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain"
                    showPinnedIcon
                    disableDeleteWhenPinned
                    onAddDraft={addDraftNotes}
                    onCloseDraft={closeNotesDrawer}
                    onChangeDraft={(content) => setDraftNote(prev => (prev ? { ...prev, content } : prev))}
                    onChangeNote={(noteId, content) => setBookNotes(prev => prev.map(note => note.id === noteId ? { ...note, content } : note))}
                    onSaveNote={saveNote}
                    onDeleteRequest={setNoteToDelete}
                    onDeleteConfirm={handleDeleteNote}
                    onDeleteCancel={() => setNoteToDelete(null)}
                    onFocusNote={(note) => {
                      setOnFocusId(String(note.id ?? ""));
                      setNoteContent(note.content);
                      setHideSave(true);
                      setDraftstate(!note.id);
                    }}
                    onCancelEditing={() => { setHideSave(false); setDraftNote(null); }}
                    onTogglePin={togglePin}
                  />

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
            className="fixed inset-0 z-70 bg-black/50 flex items-center justify-center p-3"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowWorldbuildingModal(false);
                document.body.classList.toggle('overflow-hidden', false);
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
                  onClick={() => {setShowWorldbuildingModal(false); document.body.classList.toggle('overflow-hidden', false);}}
                >
                  Close
                </button>
              </div>

              <form onSubmit={saveWorldbuildingSection} className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium">Section Title</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 bg-transparent"
                    placeholder="ex: Economy, Politics, Religion..."
                    value={worldSectionTitle}
                    onChange={(e) => setWorldSectionTitle(e.target.value)}
                    required
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
                    onClick={() => {setShowWorldbuildingModal(false); document.body.classList.toggle('overflow-hidden', false);}}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save Section
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* WORLD BUILDING EDIT MODAL */}
        {showEditWorldbuildingModal && (
          <div
            className="fixed inset-0 z-70 bg-black/50 flex items-center justify-center p-3"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeEditWorldbuildingModal();
              }
            }}
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md bg-white dark:bg-gray-900 p-4 shadow-2xl notes-scroll" onMouseDown={(e) => e.stopPropagation()}>
              {/* title */}
              <div className="flex items-start justify-between gap-3">

                  {selectedWorldSectionId ?
                    (<button 
                      className={`text-gray-500 dark:text-gray-400 hover:text-gray-300`}
                      onClick={() => setSelectedWorldSectionId(null)}
                    > <FontAwesomeIcon icon={faArrowLeft} size="lg"/>
                    </button>
                    )
                    :
                    (
                    <div>
                      <h2 className="text-lg font-semibold">Edit World Setting Section</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Choose one section, then update its title and entries.</p>
                    </div>
                    )
                  }

                <button
                  type="button"
                  className="px-2 py-1 rounded border border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={closeEditWorldbuildingModal}
                >
                  Close
                </button>
              </div>

              {/* world sections list */}
              <div className="mt-2 space-y-3">
                {/* list */}
                {!selectedWorldSectionId && (
                  <div>
                    <label className="text-sm font-medium">Choose Section</label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {worldbuildingSections.map((section) => (
                        <button
                          key={`edit-selector-${section.id}`}
                          type="button"
                          className={`text-left px-2 py-1 border border-gray-600/50 group`}
                          onClick={() => selectWorldSectionForEdit(section.id)}
                        >
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300 group-hover:text-blue-500 line-clamp-1">{section.title}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">{section.entries.length} entr{section.entries.length === 1 ? "y" : "ies"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* chosen section edit */}
                {selectedWorldSectionId && (
                  <form onSubmit={saveEditedWorldbuildingSection} className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Section Title</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 bg-transparent"
                        placeholder="ex: Economy, Politics, Religion..."
                        value={editWorldSectionTitle}
                        onChange={(e) => setEditWorldSectionTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Entries (Label + Value)</label>
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded border border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                          onClick={addEditWorldDraftEntry}
                        >
                          <FontAwesomeIcon icon={faPlus} /> Add entry
                        </button>
                      </div>

                      {editWorldDraftEntries.map((entry, index) => (
                        <div key={`edit-draft-entry-${index}`} className="rounded border border-gray-300 dark:border-gray-700 p-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Entry #{index + 1}</span>
                            <button
                              type="button"
                              className="text-xs text-red-500 disabled:opacity-40"
                              onClick={() => removeEditWorldDraftEntry(index)}
                              disabled={editWorldDraftEntries.length === 1}
                            >
                              Remove
                            </button>
                          </div>

                          <input
                            type="text"
                            className="w-full rounded border border-gray-300 dark:border-gray-700 px-2 py-1 bg-transparent"
                            placeholder="Label (ex: Cost, Rule, Limitation)"
                            value={entry.label}
                            onChange={(e) => updateEditWorldDraftEntry(index, "label", e.target.value)}
                          />
                          <textarea
                            rows={2}
                            className="w-full rounded border border-gray-300 dark:border-gray-700 px-2 py-1 bg-transparent"
                            placeholder="Value / detail"
                            value={entry.value}
                            onChange={(e) => updateEditWorldDraftEntry(index, "value", e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                        onClick={() => deleteWorldbuildingSection(selectedWorldSectionId)}
                      >
                        Delete Section
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 rounded bg-gray-500 text-white hover:bg-gray-600"
                          onClick={() => setSelectedWorldSectionId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* world atlas slide bar */}
        {isWorldAtlasMounted && (
          <div
            className={`fixed inset-0 z-50 transition-all duration-500 ease-out
              ${isWorldAtlasVisible 
                ? "bg-slate-950/70 backdrop-blur-md opacity-100" 
                : "bg-slate-950/0 backdrop-blur-0 opacity-0"}
              `}  
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                closeWorldAtlas();
              }
            }}
          >
            <div
              className={`relative h-full w-full max-w-full sm:max-w-[55vw]
              rounded-r-3xl border-r border-white/10
              bg-gradient-to-b from-[#020617] via-[#020617] to-[#0a1628]
              text-white shadow-[0_0_80px_rgba(34,211,238,0.08)]
              transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
              will-change-transform
              ${isWorldAtlasVisible 
                ? "translate-x-0 opacity-100 scale-100" 
                : "-translate-x-full opacity-0 scale-[0.98]"}
              `}
              onMouseDown={(e) => e.stopPropagation()}
            >

              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {[...Array(18)].map((_, i) => (
                  <span
                    key={i}
                    className="particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${12 + Math.random() * 10}s`,
                      animationDelay: `${Math.random() * 5}s`,
                      background: Math.random() > 0.5
                        ? "rgba(34, 211, 238, 0.7)"
                        : "rgba(168, 85, 247, 0.6)",
                    }}
                  />
                ))}
              </div>
              
              <div className="absolute top-0 right-0 h-full w-[2.5px] bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent blur-[1px]" />
              
              <div className="flex h-full flex-col overflow-hidden">
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.45em] text-cyan-300/60">Archive of Worlds</p>
                      <h2 className="mt-2 text-2xl font-semibold bg-gradient-to-r from-white via-cyan-100 to-slate-400 bg-clip-text text-transparent">
                        {currentBook?.title || "Your Story"} — Atlas
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-slate-300">
                        Reveal your setting like a guided discovery: regions, rules, legends, factions, religions, magic systems, and hidden truths.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="rounded-full border border-white/15 px-3 py-1 text-sm text-slate-200 transition hover:bg-white/10"
                      onClick={closeWorldAtlas}
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="group rounded-full border border-cyan-400/30 
                        bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100 
                        transition-all duration-300 
                        hover:bg-cyan-400/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                      onClick={openWorldbuildingModal}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add lore section
                    </button>
                    <button
                      type="button"
                      className="group rounded-full border border-cyan-400/30 
                        bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100 
                        transition-all duration-300 
                        hover:bg-cyan-400/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                      onClick={openEditWorldbuildingModal}
                      disabled={worldbuildingSections.length < 1}
                    >
                      <FontAwesomeIcon icon={faPen} /> Edit sections
                    </button>
                  </div>
                </div>

                {worldbuildingSections.length > 0 ? (
                  <div className="grid min-h-0 flex-1 lg:grid-cols-[0.6fr_1.4fr]">
                    <div className="overflow-y-auto border-b border-white/10 lg:border-b-0 lg:border-r notes-scroll">
                      <p className="p-2 text-xs uppercase tracking-[0.3em] text-slate-400">Lore paths</p>
                      <div className="">
                        {worldbuildingSections.map((section) => (
                          <button
                            key={`atlas-section-${section.id}`}
                            type="button"
                            onClick={() => setActiveWorldSectionId(section.id)}
                            className={`group relative w-full border-y px-2 py-1 text-left transition-all duration-300
                              ${activeWorldSectionId === section.id
                                  ? "border-cyan-300/60 bg-gradient-to-br from-cyan-400/10 to-transparent shadow-[0_0_25px_rgba(34,211,238,0.15)]"
                                  : "border-white/10 bg-white/1 hover:bg-white/10 hover:border-cyan-400/30"
                              }`}
                          >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition
                                bg-gradient-to-r from-cyan-400/10 via-transparent to-transparent pointer-events-none" />
                            <div className="flex items-center">
                              <span className="mr-3 group-hover:bg-cyan-500/80 rounded-full py-1 px-1 bg-cyan-500/30 pointer-events-none"/>
                              <div className="w-full">
                                <h3 className="text-base font-semibold text-white line-clamp-2">{section.title}</h3>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <span>{section.entries.length} lore note{section.entries.length === 1 ? "" : "s"}</span>
                                  <span>{activeWorldSectionId === section.id ? "Opened" : "Enter"}</span>
                                </div>
                              </div>
                            </div> 
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-y-auto notes-scroll">
                      {activeWorldSection && (
                        <div className="">
                          <div className="relative text-center">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),transparent_80%)] pointer-events-none" />
                            <h3 className="text-3xl font-semibold text-cyan-100/70 py-2">{activeWorldSection.title}</h3>
                          </div>

                          <div className="grid gap-1.5 pb-2 px-2">
                            {activeWorldSection.entries.map((entry, index) => (
                              <article
                                key={`atlas-entry-${activeWorldSection.id}-${entry.label}-${index}`}
                                className="group relative rounded-2xl border border-white/10 
                                  bg-gradient-to-br from-white/[0.06] to-transparent 
                                  p-4 transition-all duration-300
                                  hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                              >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition
                                  bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl" />
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">{entry.label}</p>
                                    <p className="mt-2 text-sm leading-7 text-slate-100 whitespace-pre-wrap">{entry.value}</p>
                                  </div>
                                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-400">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-6">
                    <div className="max-w-md rounded-3xl border border-dashed border-cyan-300/25 bg-white/[0.03] p-8 text-center">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/70">Blank map</p>
                      <h3 className="mt-3 text-2xl font-semibold bg-gradient-to-r from-cyan-200 to-slate-400 bg-clip-text text-transparent">Your world has not been charted yet.</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        Start with broad categories like Kingdoms, Magic Rules, Religions, Timeline, Factions, or Landmarks. Then let each section unfold the book's world in layers.
                      </p>
                      <button
                        type="button"
                        className="mt-5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                        onClick={openWorldbuildingModal}
                      >
                        <FontAwesomeIcon icon={faPlus} /> Create first lore section
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* book cover cropper */}
        {showBookCoverCropper && bookCoverImageSrc && createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-2xl dark:bg-gray-900">
              <div className="text-gray-500 dark:text-gray-200">
                  <h3 className="text-lg font-semibold">Crop book cover</h3>
                  <p className="mt-1 text-sm">
                      Select the part of the image that should appear on your book cards.
                  </p>
              </div>

              <div className="relative mt-4 h-96 w-full overflow-hidden rounded-2xl bg-gray-950">
                <Cropper
                  image={bookCoverImageSrc}
                  crop={bookCoverCrop}
                  zoom={bookCoverZoom}
                  aspect={3 / 4}
                  objectFit="cover"
                  onCropChange={setBookCoverCrop}
                  onZoomChange={setBookCoverZoom}
                  onCropComplete={onBookCoverCropComplete}
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium dark:text-white">Zoom</label>
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.05}
                  value={bookCoverZoom}
                  onChange={(e) => setBookCoverZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetBookCoverCropState}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBookCoverCropSave}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Use this crop
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    {/* MAIN PARENT CONTAINER DIV CLOSER */}
    </div>

  );
}
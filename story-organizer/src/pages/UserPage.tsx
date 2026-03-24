import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { db, type Book, type Notes, type Character } from "../db";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faTrashCan, faWandMagicSparkles, faBookOpen, faImages, faPenNib, faUpload } from "@fortawesome/free-solid-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";
import NotesCollection, { type EditableNote } from "../components/NotesCollection";
import { createPortal } from "react-dom";

import Cropper, { type Area, type Point } from "react-easy-crop";
import getCroppedImg from "../components/cropImage";

export default function UserPage() {
    // FUNCTIONS AND LOGIC OF USER PAGE
    const navigate = useNavigate();

    const [books, setBooks] = useState<Book[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // BOOK DETAILS INITIALIZE
    const [bookTitle, setBookTitle] = useState("");
    const [bookSummary, setBookSummary] = useState("");
    const [bookVolume, setBookVolume] = useState<string>("0");
    const [bookVolName, setbookVolName] = useState("");
    const [bookChapterCount, setBookChapterCount] = useState(0);
    const [bookStatus, setBookStatus] = useState("ongoing"); // default

    const [userNotes, setUserNotes] = useState<Notes[]>([]);
    
    const [bookTags, setBookTags] = useState<string[]>([]);
    const [bookGenre, setBookGenre] = useState<string[]>([]);

    const [characters, setCharacters] = useState<Character[]>([])
    const [tipIndex, setTipIndex] = useState(0);
    const [bookCoverMap, setBookCoverMap] = useState<Record<string, string>>({});
    const [bookCoverFile, setBookCoverFile] = useState<File | null>(null);
    const [bookCoverPreview, setBookCoverPreview] = useState<string | null>(null);

    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = useState(() => new Date());

    // USER DRAGGIN STATE
    const [setDrag, setIsDragOver] = useState(false);
    const [isDraggingBook, setIsDraggingBook] = useState(false)

    const [Addnewbooks, setAddnewBooks] = useState(false);

    const notesSubject = "";
    const notesContent = "";

    // DRAFT NOTE/ Blank note for adding new notes
    const [draftNote, setDraftNote] = useState<EditableNote | null>(null);
    const [draftNoteState, setDraftstate] = useState(false);
    const [notesShowState, setNotesShowState] = useState(false);

    function normalizeWhitespace(text: string) {
    return text
        .trim()                // remove start/end spaces
        .replace(/\s+/g, " "); // collapse multiple spaces into one
    }

    const upcaseLetter = (word: string) => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    const dashboardTips = [
        "Tip: Add at least 3 tags per book so searching later is easier.",
        "Story Tip: Give each main character a clear want and fear.",
        "App Tip: Use quick notes for scene ideas before they disappear.",
        "Story Tip: If a scene feels flat, raise the conflict or stakes.",
        "App Tip: Back up your data regularly using the header upload button.",
        "Story Tip: End chapters with a hook to pull readers forward.",

        // Story Structure
        "Story Tip: Every scene should change something—emotion, information, or power.",
        "Story Tip: Introduce conflict early. Calm beginnings can still hide tension.",
        "Story Tip: If your villain feels weak, strengthen their motivation, not just their power.",
        "Story Tip: Let characters make mistakes. Perfect characters are forgettable.",
        "Story Tip: Raise stakes gradually—don’t peak too early in your story.",
        "Story Tip: Subplots should mirror or challenge the main theme.",

        // Character Development
        "Character Tip: Give each major character a contradiction.",
        "Character Tip: Track how your character changes from Chapter 1 to the final chapter.",
        "Character Tip: Strong backstories influence decisions, not just personality.",
        "Character Tip: Relationships create tension—update connections as the story evolves.",
        "Character Tip: A flaw should actively cause problems in the plot.",
        "Character Tip: Side characters should want something too.",

        // Worldbuilding
        "World Tip: Define 3 rules of your world before expanding it.",
        "World Tip: Culture affects dialogue, behavior, and conflict.",
        "World Tip: Limitations make magic systems more interesting.",
        "World Tip: Show the world through character perspective, not exposition.",
        "World Tip: Track locations to avoid continuity errors.",

        // Organization
        "Organizer Tip: Use consistent naming for chapters and arcs.",
        "Organizer Tip: Review your character list monthly to remove unused ones.",
        "Organizer Tip: Keep timeline notes to prevent plot holes.",
        "Organizer Tip: Tag scenes by emotion or tension level.",
        "Organizer Tip: Store unused ideas instead of deleting them—you might reuse them.",
        "Organizer Tip: Group characters by faction, family, or role for clarity.",

        // Productivity
        "Focus Tip: Write messy first, organize later.",
        "Focus Tip: Set a small daily word goal to stay consistent.",
        "Focus Tip: If stuck, write the next conflict instead of the next event.",
        "Focus Tip: Take short breaks—burnout kills creativity.",
        "Focus Tip: Re-read your last scene before starting a new one.",
        "Focus Tip: Progress over perfection.",

        // App-Specific
        "App Tip: Keep character descriptions updated as the story progresses.",
        "App Tip: Use notes to track unresolved plot threads.",
        "App Tip: Assign clear roles to characters—mentor, rival, love interest, etc.",
        "App Tip: Regularly export your data as a backup.",
        "App Tip: Update your book cover to stay visually inspired.",
        "App Tip: Use tags to track themes like betrayal, redemption, or revenge.",
    ];

    const calendarLabel = calendarMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const firstWeekday = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();

    const calendarCells = Array.from({ length: 42 }, (_, i) => {
        const dayNumber = i - firstWeekday + 1;

        if (dayNumber < 1 || dayNumber > daysInMonth) {
            return null;
        }

        return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNumber);
    });

    const isSameDate = (a: Date, b: Date) => {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    };

    const today = new Date();

    const loadBooks = async () => {
        const allBooks = await db.books.toArray();
        allBooks.sort((a, b) => a.createdAt - b.createdAt);
        setBooks(allBooks);
        await loadBookCovers(allBooks.map(book => book.id));
    }

    const loadCharacter = async () => {
        const allCharacters = await db.characters.toArray();
        setCharacters(allCharacters);
    };

    const loadBookCovers = async (bookIds: string[]) => {
        if (!bookIds.length) {
            setBookCoverMap({});
            return;
        }

        const images = await db.images
            .where("bookId")
            .anyOf(bookIds)
            .toArray();

        images.sort((a, b) => b.createdAt - a.createdAt);

        setBookCoverMap(prev => {
            Object.values(prev).forEach(url => URL.revokeObjectURL(url));

            const next: Record<string, string> = {};

            images.forEach(img => {
                if (!img.bookId || next[img.bookId]) return;
                next[img.bookId] = URL.createObjectURL(img.imageBlob);
            });

            return next;
        });
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

    // LOAD BOOKS AND NOTES FROM DB AT START/ONRELOAD
    useEffect(() => {
        loadBooks();
        loadUserNotes();
        loadCharacter();
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setTipIndex(Math.floor(Math.random() * dashboardTips.length));
        }, 45000);

        return () => window.clearInterval(interval);
    }, [dashboardTips.length]);

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

        deleteBook(bookId);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    // CREATE NEW BOOK/ ASYNC WITH DEXIEDB
    async function addBook(event?: FormEvent<HTMLFormElement>) {
        event?.preventDefault();
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
            volumeName: bookVolName,
            createdAt: new Date().getTime(),
            tags: bookTags,
            genre: bookGenre,
            chapterCount: bookChapterCount,
            status: bookStatus,
        };

        // add new book to IndexedDB
        const id = await db.books.add(newBook);

        if (bookCoverFile) {
            await db.images.add({
                imageId: crypto.randomUUID(),
                charId: 0,
                bookId: newBook.id,
                createdAt: new Date().getTime(),
                imageBlob: bookCoverFile,
                isDisplayed: true,
            });
        }

        // Update React state: call set state, get prev array => assign new array, put the previous arrays/data, and new book data...
        setBooks(prev => [...prev, { ...newBook, id }]);
        await loadBookCovers([...books.map(book => book.id), newBook.id]);

        // UI stuff
        setAlert("Book Added");
        setStatePopup(true);
        setBookTitle("");
        setBookVolume("");
        setbookVolName("");
        setBookSummary("");
        setBookTags([]);
        setBookGenre([]);
        setBookChapterCount(0);
        setBookStatus("ongoing");
        setBookCoverFile(null);
        setBookCoverPreview(null);
        setTimeout(() => {setStatePopup(false); setAlert("");}, 2000);
    }

    // select book function, navigate to book page
    function selectBook(id: string) {
        navigate(`/book/${id}`);
        setDraftNote(null);
    }

    const [recentCharacter, setRecentCharacter] = useState<string | null>(null);
    const [recentBook, setRecentBook] = useState<string | null>(null);
    const [recentCharName, setRecentCharName] = useState("");
    const [recentBookTitle, setRecentBookTitle] = useState("");

    useEffect(() => {
        const recentBookRaw = localStorage.getItem("recentBook");
        const recentCharRaw = localStorage.getItem("recentCharacter");

        let recentBookId: string | null = null;
        let recentCharId: number | null = null;
        let recentCharBookId: string | null = null;

        if (recentBookRaw) {
            try {
            const parsed = JSON.parse(recentBookRaw);
            recentBookId = parsed.bookId ?? null;
            } catch {
            recentBookId = null;
            }
        }

        if (recentCharRaw) {
            try {
            const parsed = JSON.parse(recentCharRaw);
            recentCharId = Number(parsed.charId ?? NaN);
            recentCharBookId = parsed.bookId ?? null;
            } catch {
            recentCharId = null;
            recentCharBookId = null;
            }
        }

        const book = recentBookId ? books.find(b => b.id === recentBookId) : null;
        setRecentBook(recentBookId ?? "");
        setRecentBookTitle(book?.title ?? "");

        const char =
            Number.isFinite(recentCharId) && recentCharId !== null
            ? characters.find(c => c.id === recentCharId)
            : null;

        setRecentCharacter(char ? `${recentCharBookId}/${char.id}-${char.name}` : "");
        setRecentCharName(char?.name ?? "");
    }, [books, characters]);
    

    function openRecentCharacter() {
        if (!recentCharacter) return;

        navigate(`/book/${recentCharacter}`);
    }

    // COLOR PICKER
    const stickyColors = [
    "yellow",
    "pink",
    "green",
    "sky",
    "purple",
    "gray",
    ];

    const [isNotesDrawerMounted, setIsNotesDrawerMounted] = useState(false);
    const [isNotesDrawerVisible, setIsNotesDrawerVisible] = useState(false);
    const notesFabRef = useRef<HTMLButtonElement | null>(null);

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

    useEffect(() => {
        return () => {
            Object.values(bookCoverMap).forEach(url => URL.revokeObjectURL(url));
            if (bookCoverPreview) URL.revokeObjectURL(bookCoverPreview);
        };
    }, [bookCoverMap, bookCoverPreview]);

    function resetCropState() {
        setImageSrc(null);
        setSelectedFile(null);
        setCrop({ x: 0, y: 0 });
        setZoom(0.5);
        setCroppedAreaPixels(null);
        setShowCropper(false);
    }
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    function handleBookCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget;
        const file = event.target.files?.[0] ?? null;
        if (event.target.files?.[0]) {
            setSelectedFile(event.target.files[0]);
        }

        if (!file) {
            if (bookCoverPreview) {
                URL.revokeObjectURL(bookCoverPreview);
            }

            setBookCoverFile(null);
            setBookCoverPreview(null);
            resetCropState();
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result;

            if (typeof result !== "string") {
                alert("Could not read that image file.");
                return;
            }

        setImageSrc(result);
            setCrop({ x: 0, y: 0 });
            setZoom(0.6);
            setCroppedAreaPixels(null);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
        input.value = "";
    }

    const onCropComplete = (_croppedArea: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    };

    const handleCropSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, bookCoverFile?.name ?? "book-cover.jpg");

            if (bookCoverPreview) {
                URL.revokeObjectURL(bookCoverPreview);
            }

            const previewUrl = URL.createObjectURL(croppedFile);
            setBookCoverFile(croppedFile);
            setBookCoverPreview(previewUrl);
            resetCropState();
        } catch (error) {
            console.error("Failed to crop book cover", error);
            alert("We couldn't crop that image. Please try another image.");
        }
    };

    async function addDraftNotes() {
        if (draftNote) return;
        
        const randomColor =
            stickyColors[Math.floor(Math.random() * stickyColors.length)];

        const newNotes = {
            notesId: crypto.randomUUID(),
            subject: notesSubject,
            content: notesContent,
            createdAt: new Date().getTime(),
            color: randomColor,
            isDraft: true,
            bookId: "",
            charId: null,
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
            setUserNotes(prev => [
                { ...noteData, id: dbId }, ...prev
            ]);

            setDraftNote(null);
            setDraftstate(false);
            setHideSave(false);
        } 
        else {
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

    // SHOW/HIDE CREATE NEW BOOK FORM
    const addBooksState = () => {
        setAddnewBooks(!Addnewbooks);
    };

    const [hideSave, setHideSave] = useState(false);
    const [onFocusId, setOnFocusId] = useState("");
    const [noteContent, setNoteContent] = useState("");

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
        setUserNotes(prev => prev.filter(notes => notes.id !== note.id));
        
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

    setUserNotes(prev => [deletedNote!, ...prev]);

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

    const titleRef = useRef<HTMLInputElement>(null);

    const ongoingBooks = books.filter(book => book.status === "ongoing").length;
    const totalChapters = books.reduce((sum, book) => sum + (book.chapterCount ?? 0), 0);
    const latestBook = [...books].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;

    // SCROLL BEHAVIOR AFTER opening create book form
    useEffect(() => {
        if (Addnewbooks && titleRef.current) {
            const headerHeight = 165; // Change this to your actual header height
            const elementPosition = titleRef.current.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - headerHeight;

            window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
            });

            titleRef.current.focus();
        }
    }, [Addnewbooks]);

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    
    return (

    // MAIN PARENT CONTAINER DIV CLOSER
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 pt-15 pb-6 lg:flex-row">
    
        {/* LEFT SIDE CONTAINER */}
        <aside className="hidden lg:block lg:w-[320px] xl:w-[360px]">
            <div className="sticky top-15 space-y-3">

                {/* 1st section dashcard */}
                <section className="overflow-hidden rounded-3xl border border-violet-800/70 bg-gradient-to-br from-violet-900/50 via-indigo-900 to-cyan-950 p-5 text-white shadow-2xl">
                    <div className="flex items-center justify-between"> 
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Story projects</p>
                            <h1 className="mt-2 text-3xl font-black leading-tight">Shape your universe faster.</h1>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                            <FontAwesomeIcon icon={faWandMagicSparkles} size="lg" />
                        </div>
                    </div>

                    <p className="mt-4 text-sm text-white/85">Plan books, protect ideas, and keep every project visually alive with custom covers and quick access to your latest work.</p>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Books</p>
                            <p className="mt-1 text-2xl font-bold">{books.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Characters</p>
                            <p className="mt-1 text-2xl font-bold">{characters.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Notes</p>
                            <p className="mt-1 text-2xl font-bold">{userNotes.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Chapters</p>
                            <p className="mt-1 text-2xl font-bold">{totalChapters}</p>
                        </div>
                    </div>
                </section>

                {/* 2nd section continue writing quick path */}
                <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                            <FontAwesomeIcon icon={faPenNib} />
                        </div>
                        <div>
                            <h2 className="font-semibold">Continue writing</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Jump back into your last active spaces.</p>
                        </div>
                    </div>

                        <div className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Recent book</p>
                            <p className="mt-1 truncate text-sm font-semibold">{recentBookTitle || latestBook?.title || "Start a new world"}</p>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="mt-3 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-300"
                                    onClick={() => recentBook ? selectBook(recentBook) : latestBook && selectBook(latestBook.id)}
                                >
                                    Open workspace
                                </button>
                            </div>
                        </div>

                            <div className="rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Recent character</p>
                            <p className="mt-1 truncate text-sm font-semibold">{recentCharName || "No character opened yet"}</p>
                            {recentCharacter && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        className="mt-3 rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                        onClick={openRecentCharacter}
                                    >
                                        Open profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3rd create new book section */}
                <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold">Create new book</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Give each story its own visual identity.</p>
                        </div>
                        <button 
                            value={bookTitle}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-300 text-black transition hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                            onClick={addBooksState}
                            title="Add a book"
                        >
                            {Addnewbooks ? <FontAwesomeIcon icon={faMinus} size="xs" className="transition duration-500"/> : <FontAwesomeIcon icon={faPlus} size="xs"/>}
                        </button>
                    </div>

                    {Addnewbooks && (
                        <form 
                            className="mt-3 space-y-3 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/60 px-2 py-4 dark:border-indigo-800 dark:bg-indigo-950/20"
                            onSubmit={addBook}
                        >
                            <div>
                                <label className="mb-1 block text-sm font-medium">Title</label>
                                <input
                                    ref={titleRef}
                                    className="w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:placeholder-gray-600"
                                    value={bookTitle}
                                    onChange={e => setBookTitle(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                                    title="Add new book"
                                    placeholder="Enter book title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Summary</label>
                                <textarea
                                    rows={4}
                                    className="w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:placeholder-gray-600"
                                    placeholder="What makes this story compelling?"
                                    onFocus={(e) => autoResize(e)}
                                    value={bookSummary}
                                    onChange={e => setBookSummary(e.target.value)}
                                    onBlur={(e) => { e.currentTarget.style.height = "auto";}}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Current Volume</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:placeholder-gray-600"
                                        placeholder="0"
                                        value={bookVolume}
                                        onChange={e => setBookVolume(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Status</label>
                                    <select
                                        className="w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-900"
                                        value={bookStatus}
                                        onChange={e => setBookStatus(e.target.value)}
                                    >
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="hiatus">Hiatus</option>
                                        <option value="dropped">Dropped</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Book cover</label>
                                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white/70 px-4 py-4 text-sm text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                    <FontAwesomeIcon icon={faUpload} />
                                    <span>{selectedFile ? selectedFile.name : "Upload a cover image"}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleBookCoverChange} />
                                </label>
                                {bookCoverPreview && (
                                    <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                                        <img src={bookCoverPreview} alt="Book cover preview" className="h-44 w-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl"
                            >
                                Save book to library
                            </button>
                        </form>
                    )}
                </section>

                {/* 4th section ongoing progress bar */}
                <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <FontAwesomeIcon icon={faBookOpen} />
                        </div>
                        <div>
                            <h2 className="font-semibold">Story rhythm</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">A quick pulse check for your library.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="rounded-2xl bg-gray-50 p-3 dark:bg-gray-800/70">
                            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-400">
                                <span>Ongoing projects</span>
                                <span>{ongoingBooks}/{books.length || 1}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${books.length ? (ongoingBooks / books.length) * 100 : 0}%` }} />
                            </div>
                        </div>
                    </div>

                </section>

                {/* 5th section calendar/ features soon */}
                <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-1">
                        <button
                            type="button"
                            onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                            className="rounded-xl border border-gray-300 px-3 py-1 text-center transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                            title="Previous month"
                        >‹</button>
                        <p className="text-sm font-semibold">{calendarLabel}</p>
                        <button
                            type="button"
                            onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                            className="rounded-xl border border-gray-300 px-3 py-1 text-center transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                            title="Next month"
                        >›</button>
                    </div>
                    <div className="grid grid-cols-7 text-center text-xs text-gray-500">
                        {weekDays.map(day => <span key={day}>{day}</span>)}
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-1">
                        {calendarCells.map((dateValue, index) => {
                            if (!dateValue) return <div key={`empty-${index}`} />;
                            const selected = isSameDate(dateValue, selectedDate);
                            const isToday = isSameDate(dateValue, today);
                            return (
                                <button
                                    key={dateValue.toISOString()}
                                    type="button"
                                    onClick={() => setSelectedDate(dateValue)}
                                    className={`h-9 rounded-xl text-xs transition ${selected ? "bg-blue-600 text-white" : isToday ? "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                                >
                                    {dateValue.getDate()}
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Selected date: {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
            </div>
        </aside>
        
        {/* CENTER CONTAINER */}
        <main className="min-w-0 flex-1">
            {/* center section header web app details */}
            <section className="rounded-3xl border border-gray-200 p-4 shadow-lg bg-gradient-to-br from-slate-500 dark:from-slate-900 via-blue-900/30 to-cyan-950 border border-indigo-500/30">
                <div className="flex flex-col gap-4 justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Your library</p>
                        <h2 className="mt-2 text-3xl font-black">A visual shelf for every world you're building.</h2>
                        <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-300">Inspired by modern writing dashboards, this layout gives each project a stronger identity with cover art, quick metadata, and a clearer path back into your workspace.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-2xl shadow-xl g-gray-50 px-4 py-3 text-center bg-white dark:bg-gray-800/70">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Books</p>
                            <p className="mt-1 text-xl font-bold">{books.length}</p>
                        </div>
                        <div className="rounded-2xl shadow-xl bg-gray-50 px-4 py-3 text-center bg-white dark:bg-gray-800/70">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Ongoing</p>
                            <p className="mt-1 text-xl font-bold">{ongoingBooks}</p>
                        </div>
                        <div className="rounded-2xl shadow-xl bg-gray-50 px-4 py-3 text-center bg-white dark:bg-gray-800/70">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Notes</p>
                            <p className="mt-1 text-xl font-bold">{userNotes.length}</p>
                        </div>
                        <div className="rounded-2xl shadow-xl bg-gray-50 px-4 py-3 text-center bg-white dark:bg-gray-800/70">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Covers</p>
                            <p className="mt-1 text-xl font-bold">{Object.keys(bookCoverMap).length}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/*create new book section on mobile*/}
            <section className="mt-3 block lg:hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold">Create new book</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Give each story its own visual identity.</p>
                    </div>
                    <button 
                        value={bookTitle}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-300 text-black transition hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                        onClick={addBooksState}
                        title="Add a book"
                    >
                        {Addnewbooks ? <FontAwesomeIcon icon={faMinus} size="xs" className="transition duration-500"/> : <FontAwesomeIcon icon={faPlus} size="xs"/>}
                    </button>
                </div>

                {Addnewbooks && (
                    <form 
                        className="mt-3 space-y-3 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/60 px-2 py-4 dark:border-indigo-800 dark:bg-indigo-950/20"
                        onSubmit={addBook}
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium">Title</label>
                            <input
                                className="w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:placeholder-gray-600"
                                value={bookTitle}
                                onChange={e => setBookTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                                title="Add new book"
                                placeholder="Enter book title"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Summary</label>
                            <textarea
                                rows={4}
                                className="w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:placeholder-gray-600"
                                placeholder="What makes this story compelling?"
                                onFocus={(e) => autoResize(e)}
                                value={bookSummary}
                                onChange={e => setBookSummary(e.target.value)}
                                onBlur={(e) => { e.currentTarget.style.height = "auto";}}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Current Volume</label>
                                <input
                                    type="number"
                                    className="w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:placeholder-gray-600"
                                    placeholder="0"
                                    value={bookVolume}
                                    onChange={e => setBookVolume(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Status</label>
                                <select
                                    className="w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-900"
                                    value={bookStatus}
                                    onChange={e => setBookStatus(e.target.value)}
                                >
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="hiatus">Hiatus</option>
                                    <option value="dropped">Dropped</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Book cover</label>
                            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white/70 px-4 py-4 text-sm text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                <FontAwesomeIcon icon={faUpload} />
                                <span>{selectedFile ? selectedFile.name : "Upload a cover image"}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleBookCoverChange} />
                            </label>
                            {bookCoverPreview && (
                                <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <img src={bookCoverPreview} alt="Book cover preview" className="h-44 w-full object-cover" />
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-xl"
                        >
                            Save book to library
                        </button>
                    </form>
                )}
            </section>
            
            {/* library shelf list */}
            <section className="mt-3 rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold">Library shelf</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click any book to open its story workshop.</p>
                    </div>

                    <div className="hidden items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300 sm:flex">
                        <FontAwesomeIcon icon={faImages} />
                        Covers make the shelf feel alive.
                    </div>

                </div>

                {!books.length && (
                    <div className="flex min-h-[360px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-indigo-50 px-10 py-20 text-center dark:border-gray-700 dark:from-gray-900 dark:to-indigo-950/20"> 
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500 text-white shadow-lg">
                            <FontAwesomeIcon icon={faBookOpen} size="lg" />
                        </div>
                        <h3 className="mt-5 text-2xl font-bold">Your story shelf is waiting.</h3>
                        <p className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">Create your first book, upload a cover, and turn this page into a visual command center for your worlds, characters, and notes.</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-2 items-stretch place-items-center">
                    {books.map(book => (
                        <article
                        role="list"
                        key={book.id}
                        draggable
                        onDragStart={handleDragStart}
                        data-id={book.id}
                        data-title={book.title}
                        onDragEnd={() => { setDraggingId(null); setIsDraggingBook(false); }}
                        onClick={() => selectBook(book.id!)}
                        className={`
                            relative group cursor-pointer overflow-hidden
                            w-45 h-60 sm:w-60 sm:h-75 rounded-tl-xl rounded-bl-lg
                            bg-white dark:bg-gray-800
                            shadow-lg hover:-translate-y-2 hover:shadow-2xl
                            transition-all duration-300 animate-fadeDown
                            ${draggingId === book.id ? "opacity-0" : ""}`}
                        >
                            {/* Spine/Edge Design (Always visible or tucked behind) */}
                            {bookCoverMap[book.id] ? (
                                <div className="absolute -left-1 top-0 h-75 w-4 bg-gray-800 rounded-tl-lg z-20"/>
                            ) : (
                                <div className="absolute -left-1 top-0 h-75 w-4 bg-gray-600 rounded-tl-lg z-20" />
                            )}

                            {/* 1. FRONT COVER LAYER: Fades out on hover */}
                            <div className="absolute inset-0 z-10 transition-opacity duration-500 group-hover:opacity-15">
                                {bookCoverMap[book.id] ? (
                                    <div className="relative w-full h-full">

                                        {/* full image */}
                                        <img
                                            src={bookCoverMap[book.id]}
                                            alt={`${book.title} cover`}
                                            className="relative w-full h-full object-cover"
                                        />

                                    </div>
                                ) : (
                                    <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-900/30 to-cyan-950 border border-indigo-500/30 p-5 text-white">
                                        <div className="flex items-start justify-between group-hover:opacity-0"> 
                                            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.25em] ">Story</span>
                                            <FontAwesomeIcon icon={faWandMagicSparkles} />
                                        </div>
                                        <p className="text-xs uppercase text-center mb-30 tracking-[0.2em] text-white/70 group-hover:opacity-0">No cover yet</p>
                                    </div>
                                )}
                                {/* Overlay for Title on Cover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                                    <h3 className="text-lg font-black text-gray-300 leading-tight line-clamp-2 group-hover:opacity-0">{upcaseLetter(book.title)}</h3>
                                </div>
                            </div>

                            {/* 2. BACK/CONTENT LAYER: Rises up and fades in on hover */}
                            <div className="absolute inset-0 p-5 flex flex-col justify-between bg-gray-50 dark:bg-gray-700 
                                            translate-y-4 opacity-0 transition-all duration-500 
                                            group-hover:translate-y-0 group-hover:opacity-100">
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest dark:text-gray-200">Details</span>
                                        <span className="text-[10px] dark:text-gray-400">Vol {book.volume || 0}</span>
                                    </div>
                                    
                                    <h3 className="text-md font-bold dark:text-white line-clamp-2">{book.title}</h3>
                                    
                                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed">
                                        {book.summary || "Open this workspace and shape the next scenes, chapters, and arcs."}
                                    </p>

                                    <div className="flex flex-wrap gap-1.5">
                                        {(book.genre || []).slice(0, 2).map((genre, i) => (
                                            <span key={i} className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 dark:bg-stale-900/40">
                                                {genre}
                                            </span>
                                        ))}
                                        {book.genre.length > 2 && (
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-300">+{book.genre.length - 2}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1 mt-1">
                                    <div className="flex items-center justify-between text-[10px] text-gray-200">
                                        <span>{book.chapterCount ?? 0} Chapters</span>
                                        <span className="uppercase">{book.status}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between rounded-xl bg-gray-800 p-2 text-white shadow-md">
                                        <span className="text-[11px] font-bold ml-2">Open Workspace</span>
                                        <span className="bg-white text-gray-950 rounded-lg px-2 py-1 text-[10px] font-bold">Enter</span>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>

        {/* RIGHT CONTAINER */}
        <aside className="hidden xl:block xl:w-[280px]">
            <div className="sticky top-15 space-y-3">
                <div className="rounded-3xl border border-emerald-300 bg-emerald-50/80 p-4 shadow-lg dark:border-emerald-700 dark:bg-emerald-900/20">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Creative prompt</p>
                    <p className="mt-2 text-sm leading-6">{dashboardTips[tipIndex]}</p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="font-semibold">Story Dreamers direction use</h3>
                    <ul className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <li>• Hero dashboard styling inspired by creative workspace apps.</li>
                        <li>• Visual shelf cards so each project feels collectible and distinct.</li>
                        <li>• Metadata grouped by writing flow: status, chapter progress, and genre identity.</li>
                    </ul>  
                </div>
            </div>
        </aside>

        {/* MODALS */}
            {/* TRASHCAN FEATURE/DELETION OF BOOK CARD ONDROP */}
            {isDraggingBook && (
                <div
                className="
                    fixed top-16 right-6 z-50
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
                    opacity-50
                    transition-transform
                    ${setDrag ? "scale-110 bg-red-500/50" : ""}
                    `}
                > 
                <FontAwesomeIcon 
                icon={faTrashCan} 
                size="2xl"
                bounce={isDraggingBook && !setDrag}
                />
                </div>
    
                {/* TOOLTIP */}
                {/* <span
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
                </span> */}
                </div>
            )}
            
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

            {/* LIBRARY NOTES */}
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
    
                    {/* THIS IS FOR THE USER NOTES */}
                    { notesShowState && (
                    <NotesCollection
                        className={`absolute bottom-0 xxs:right-15
                        bg-gray-100 dark:bg-gray-800
                        shadow-2xl p-3
                        w-full max-w-[60vh] max-h-[90vh]
                        transition-all duration-500
                        ${isNotesDrawerVisible ? "translate-y-0" : "translate-y-full"}
                        `}
                        title="Author Notes"
                        notes={userNotes}
                        draftNote={draftNote}
                        draftNoteState={draftNoteState}
                        noteToDelete={noteToDelete}
                        hideSave={hideSave}
                        onFocusId={onFocusId}
                        contentClassName="h-[calc(75vh-3.5rem)] xxs:h-[calc(85vh-3.5rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain mt-2"
                        noteContent={noteContent}
                        emptyMessage="Add notes, references, future scenarios, book plans, etc..."
                        onAddDraft={addDraftNotes}
                        onCloseDraft={closeNotesDrawer}
                        onChangeDraft={(content) => setDraftNote(prev => (prev ? { ...prev, content } : prev))}
                        onChangeNote={(noteId, content) => setUserNotes(prev => prev.map(note => note.id === noteId ? { ...note, content } : note))}
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
                    />
                    )}
    
                    {/* notes closer */}
                    </div>
                )}
                </>,
                document.body
            )}

            {showCropper && imageSrc && createPortal(
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
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={3 / 4}
                                objectFit="cover"
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium">Zoom</label>
                            <input
                                type="range"
                                min={0.5}
                                max={3}
                                step={0.05}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={resetCropState}
                                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition text-gray-500 dark:text-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCropSave}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
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
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { db, type Book, type Notes, type Character } from "../db";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faTrashCan} from "@fortawesome/free-solid-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";

export default function UserPage() {
    // FUNCTIONS AND LOGIC OF USER PAGE
    const navigate = useNavigate();

    const [books, setBooks] = useState<Book[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // BOOK DETAILS INITIALIZE
    const [bookAdded, setBookAdded] = useState(false);
    const [bookTitle, setBookTitle] = useState("");
    const [bookSummary, setBookSummary] = useState("");
    const [bookVolume, setBookVolume] = useState<string>("0");
    const [bookChapterCount, setBookChapterCount] = useState(0);
    const [bookStatus, setBookStatus] = useState("ongoing"); // default

    const [userNotes, setUserNotes] = useState<Notes[]>([]);
    
    const [bookTags, setBookTags] = useState<string[]>([]);
    const [bookGenre, setBookGenre] = useState<string[]>([]);

    const [characters, setCharacters] = useState<Character[]>([])
    const [tipIndex, setTipIndex] = useState(0);

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
    const [draftNote, setDraftNote] = useState<Notes | null>(null);
    const [draftNoteState, setDraftstate] = useState(false);
    const [notesShowState, setNotesShowState] = useState(true);

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
    }

    const loadCharacter = async () => {
        const allCharacters = await db.characters.toArray();
        setCharacters(allCharacters);
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
            tags: bookTags,
            genre: bookGenre,
            chapterCount: bookChapterCount,
            status: bookStatus,
        };

        // add new book to IndexedDB
        const id = await db.books.add(newBook);

        // Update React state: call set state, get prev array => assign new array, put the previous arrays/data, and new book data...
        setBooks(prev => [...prev, { ...newBook, id }]);
        
        console.log(newBook);

        // UI stuff
        setAlert("Book Added");
        setStatePopup(true);
        setBookTitle("");
        setBookVolume("");
        setBookSummary("");
        setBookTags([]);
        setBookGenre([]);
        setBookChapterCount(0);
        setBookStatus("ongoing");
        setBookAdded(true);
        setTimeout(() => {setBookAdded(false); setStatePopup(false); setAlert("");}, 2000);
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
            } catch {}
        }

        if (recentCharRaw) {
            try {
            const parsed = JSON.parse(recentCharRaw);
            recentCharId = Number(parsed.charId ?? NaN);
            recentCharBookId = parsed.bookId ?? null;
            } catch {}
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

    // COLOR MAP FOR RANDOM COLOR ASSIGNMENT OF NOTES
    const colorMap: Record<string, string> = {
    yellow: "bg-yellow-200 dark:bg-yellow-800",
    pink: "bg-pink-200 dark:bg-pink-800",
    green: "bg-green-200 dark:bg-green-800",
    sky: "bg-sky-200 dark:bg-sky-800",
    purple: "bg-purple-200 dark:bg-purple-800",
    gray: "bg-gray-200 dark:bg-gray-900"
    };

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

    // SHOW/HIDE NOTES DISPLAY
    const displayNotes = () => {
        setNotesShowState(!notesShowState);
    };

    const [hideSave, setHideSave] = useState(false);
    const [onFocusId, setOnFocusId] = useState("");

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

    // SCROLL BEHAVIOR AFTER opening create book form
    useEffect(() => {
        if (Addnewbooks && titleRef.current) {
            titleRef.current?.scrollIntoView({behavior: "smooth" });
            titleRef.current.focus();
        }
    }, [Addnewbooks]);
    
    return (

    // MAIN PARENT CONTAINER DIV CLOSER
    <div className="w-full mx-auto flex justify-center gap-2 pt-15">
    
        {/* LEFT SIDE CONTAINER */}
        <div className="hidden xs:block flex-1 relative">

            {/* LEFT SIDE INNER CONTAINER */}
            <div className="sticky top-15 space-y-2">

                <div className="h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">
                    {/* TOP DASHBOARD SECTION */}
                    <section className="rounded-md shadow-lg bg-gray-100 dark:bg-gray-900 p-3 space-y-3 mb-2">
                        {!Addnewbooks && (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-xl font-semibold">Dashboard</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back — keep your story momentum.</p>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                                    <p className="text-xs text-gray-500">Books</p>
                                    <p className="text-xl font-bold">{books.length}</p>
                                </div>
                                <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                                    <p className="text-xs text-gray-500">UserNotes</p>
                                    <p className="text-xl font-bold">{userNotes.length}</p>
                                </div>
                                <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                                    <p className="text-xs text-gray-500">Characters</p>
                                    <p className="text-xl font-semibold">{characters.length}</p>
                                </div>
                            </div>

                            {/* Quick Actions + Continue Writing */}
                            <div className="grid grid-cols-1 lg:grid-cols-1 gap-2">
                                <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                                    <h3 className="font-semibold">Continue Writing</h3>
                                    <div className="">
                                        <label className="text-xs text-gray-400">Recent book:</label>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm truncate indent-2">{recentBookTitle ? recentBookTitle : "Check your books..."}</p>
                                            {recentBook && (
                                                <button
                                                    type="button"
                                                    className="px-2 py-1 text-xs rounded-md bg-gray-800 text-white hover:bg-gray-700 transition"
                                                    onClick={() => selectBook(recentBook)}
                                                >
                                                    Open
                                                </button>
                                            )}
                                        </div>
                                        <label className="text-xs text-gray-400">Recent character:</label>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm truncate indent-2">{recentCharName ? recentCharName : "See your characters..."}</p>
                                            {recentCharacter && (
                                                <button
                                                    type="button"
                                                    className="px-2 py-1 text-xs rounded-md bg-gray-800 text-white hover:bg-gray-700 transition"
                                                    onClick={openRecentCharacter}
                                                >
                                                    Open
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rotating Tip Card */}
                            <div className="rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-900/20 p-3">
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Tips from StoryDreamer.</p>
                                <p className="text-sm min-h-6 transition-all duration-300">{dashboardTips[tipIndex]}</p>
                            </div>
                        </>
                        )}

                        {/* CREATE BOOK FORM TITLE */}
                        <div className="flex justify-between rounded-md border border-gray-200 dark:border-gray-700 p-3">
                            <h3 className="text-2xl font-semibold">Create New Book</h3>

                            <div className="flex justify-center">
                                <button 
                                    value={bookTitle}
                                    className="border-gray-500 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 px-2 dark:border-white dark:text-white"
                                    onClick={addBooksState}
                                    title="Add a book"
                                >
                                    {Addnewbooks ? <FontAwesomeIcon icon={faMinus} size="xs" className="transition duration-500"/> : <FontAwesomeIcon icon={faPlus} size="xs"/>}
                                </button>
                            </div>
                        </div>

                    </section>

                    {/* CREATE NEW BOOK FORM */}
                    {(Addnewbooks && 
                    
                    <div className="flex-1 rounded-md shadow-lg p-3 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300 animate-fadeDown">
                    <form className="space-y-2">
                    
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                        Title
                        </label>
                        <input
                        ref={titleRef}
                        className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
                        value={bookTitle}
                        onChange={e => setBookTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") addBook();
                            }}
                        title="Add new book"
                        placeholder="Enter book title"
                        />
                    </div>

                    {/* Summary */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                        Summary
                        </label>
                        <textarea
                        rows={4}
                        className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
                        placeholder="Enter book summary"
                        onFocus={(e) => autoResize(e)}
                        value={bookSummary}
                        onChange={e => setBookSummary(e.target.value)}
                        onBlur={(e) => { e.currentTarget.style.height = "auto";}}
                        />
                    </div>

                    {/* Current Volume */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                        Current Volume
                        </label>
                        <input
                        type="number"
                        className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
                        placeholder="0"
                        onChange={e => setBookVolume(e.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                        onClick={addBook}
                    >
                        SAVE
                    </button>
                    </form>
                    </div>)}

                    {/* SIMPLE INTERACTIVE CALENDAR */}
                    <div className="rounded-md shadow-lg bg-gray-100 dark:bg-gray-900 p-3">
                        <div className="flex items-center justify-between mb-1">
                            <button
                                type="button"
                                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                className="px-2 text-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                title="Previous month"
                            >
                                ‹
                            </button>

                            <p className="text-sm font-semibold">{calendarLabel}</p>

                            <button
                                type="button"
                                onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                className="px-2 text-center rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                title="Next month"
                            >
                                ›
                            </button>
                        </div>

                        <div className="grid grid-cols-7 text-center text-xs text-gray-500">
                            {weekDays.map(day => (
                                <span key={day}>{day}</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {calendarCells.map((dateValue, index) => {
                                if (!dateValue) {
                                    return <div key={`empty-${index}`} />;
                                }

                                const selected = isSameDate(dateValue, selectedDate);
                                const isToday = isSameDate(dateValue, today);

                                return (
                                    <button
                                        key={dateValue.toISOString()}
                                        type="button"
                                        onClick={() => setSelectedDate(dateValue)}
                                        className={`h-7 rounded-md text-xs transition ${selected
                                            ? "bg-blue-600 text-white"
                                            : isToday
                                            ? "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200"
                                            : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                                    >
                                        {dateValue.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Selected date: {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                    </div>

                </div>

                

            </div>
        </div>
        
        {/* CENTER CONTAINER */}
        <div className="w-full max-w-3xl mx-auto">
            
            {/* LIBRARY SECTION BOOK LIST / HOMEPAGE */}
            <div className="p-3 mb-3 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900">
                
                <div className="py-4 gap-2 flex xs:hidden">

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
                    className="border-gray-200 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 p-1 transition dark:border-white dark:text-white"
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
                <h2 className="text-2xl font-semibold">Library</h2>

                {!books.length && (
                <div className="w-full flex justify-center items-center py-20 px-10"> 
                    <h1 className="text-3xl font-bold text-gray-400 text-center">
                        PLEASE ADD BOOKS HERE. INSTEAD OF JUST LETTING THEM GATHER DUST IN YOUR INSANE MIND...
                    </h1>
                </div>
                )}
                
                <div className="grid grid-cols-2 px-15 pt-2 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-x-20 md:gap-y-5 pb-1 place-items-center overflow-y-auto notes-scroll">
                    {books.map(book => (
                    <div
                    role="list"
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
                        dark:bg-gradient-to-br dark:from-gray-600 dark:to-gray-500
                        shadow-lg
                        hover:-translate-y-2 hover:shadow-2xl
                        transition-all duration-300 animate-fadeDown
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
                    <div className="p-4 pt-15 text-base text-center font-semibold line-clamp-5 max-h-45">
                        {book.title}

                        {/* Vertical TITLE */}
                        <div className="absolute text-white text-outline-2 -left-2 top-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-rl] truncate line-clamp-1 max-h-50">
                        <span className="text-xs font-bold">{book.title}</span>
                        </div>
                    </div>
                    <p className="text-center text-sm">Status: {upcaseLetter(book.status)}</p>
                    
                    </div>
                    ))}
                </div>  
                


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
                <div className="h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">
                    
                    {/* THIS IS FOR THE USER NOTES */}
                    { notesShowState && (
                    <div 
                        className=""
                    >
                        {[ ...(draftNote ? [draftNote] : []), ...userNotes ].map(notes => (
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
                                onClick={() => {setNoteToDelete(notes);}}>
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
                            onFocus={(e) => {autoResize(e); setOnFocusId(String(notes.id!)); setHideSave(true);
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
                                } 
                                else {
                                // This is saved note
                                setUserNotes(prev =>
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
                                className="flex px-4 py-1 bg-blue-700 rounded-xl hover:bg-blue-800"
                                onClick={() => {saveNote(notes);}}
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
                    )}

                </div>

            </div>

        </div>

        {/* MODALS */}
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

    {/* MAIN PARENT CONTAINER DIV CLOSER */}
    </div>

    );
}
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport, faCircleUser, faUpload, faSpinner, faDownload, faArrowLeft, faUser, faHouse } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useState } from "react";
import { db } from "../db";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";

import { useGoogleAuth, type GoogleUser } from "../context/GoogleAuthContext";
import { signOut } from "../services/googleAuth";
import { downloadDriveFile, findBackupFile, uploadJsonToDrive } from "../services/driveService";

export default function Header() {
    const navigate = useNavigate();

    const { currentBookId, characterSlug } = useParams();

    const [bookTitle, setBookTitle] = useState("");
    const [characterName, setCharacterName] = useState("");

    const [showAccountSettings, setShowAccountSettings] = useState(false);

    const isBookContext = Boolean(currentBookId);

    const formatCharacterName = (slug: string) => {
        const [, slugName = ""] = slug.split(/-(.+)/);

        return slugName
            .split("-")
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    useEffect(() => {
        if (!currentBookId) return;
        localStorage.setItem(
            "recentBook",
            JSON.stringify({ bookId: currentBookId, viewedAt: Date.now() })
        );
    }, [currentBookId]);

    useEffect(() => {
        if (!currentBookId || !characterSlug) return;
        const charId = Number(characterSlug.split("-")[0]);
        localStorage.setItem(
            "recentCharacter",
            JSON.stringify({
            bookId: currentBookId,
            charId,
            characterSlug,
            viewedAt: Date.now(),
            })
        );
    }, [currentBookId, characterSlug]);

    useEffect(() => {
        if (!currentBookId) {
            setBookTitle("");
            setCharacterName("");
            return;
        }
        let ignore = false;

        const fetchBookTitle = async () => {
            const response = await db.books.get(currentBookId);

            if (!ignore) {
                setBookTitle(response?.title ?? "");
            }
        };

        if (characterSlug) {
            setCharacterName(formatCharacterName(characterSlug));
        } else {
            setCharacterName("");
        }

        fetchBookTitle();
        return () => {
            ignore = true;
        };
    }, [currentBookId, characterSlug]);

    const [openSearch, setOpenSearch] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { user, signIn } = useGoogleAuth();

    const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);

    const [showGoogleSaveModal, setShowGoogleSaveModal] = useState(false);
    const [isGoogleSaving, setIsGoogleSaving] = useState(false);

    const [successGoogle, setSuccessGoogle] = useState(false);
    const [errorGoogle, setErrorGoogle] = useState<string | null>(null);

    const [backupFileId, setBackupFileId] = useState<string | null>(null);


    const toggleTheme = () => {
        setDarkTheme(prev => (prev === "dark" ? "light" : "dark"));
    };

    const [darkTheme, setDarkTheme] = useState(
        localStorage.getItem("theme") || "dark"
    );

    useEffect(() => {
        if(googleUser) return;
        const gUser = localStorage.getItem("googleConnected");
        const userObject = JSON.parse(gUser!);
        setGoogleUser(userObject);
    }, [googleUser]);

    useEffect(() => {
        if(!user) return;

        setGoogleUser(user);
    }, [user]);

    useEffect(() => {
      const checkBackup = async () => {
        const token = localStorage.getItem("googleAccessToken");
        if (!token) return;
    
        try {
          const file = await findBackupFile(token);
          if (file) {
            setBackupFileId(file.id);
            localStorage.setItem("googleFileID", file.id);
          }
        } catch (err) {
          console.error("Drive check failed");
        }
      };

    checkBackup();
    }, [user]);
    

    // DARK MODE EFFECT
    useEffect(() => {
        const html = document.documentElement;

        if (darkTheme === "dark") {
        html.classList.add("dark");
        } else {
        html.classList.remove("dark");
        }

        localStorage.setItem("theme", darkTheme);
    }, [darkTheme]);


    // Show IMPORT/EXPORT MODAL
    function showModalFile(state: boolean) {
        setShowFileModal(state);
        setSelectedFile(null);
        document.body.classList.toggle('overflow-hidden', state);
    }


    // Show Google Save MODAL
    function showSaveGoogleModal(state: boolean) {
        if(!googleUser) {
            alert("Sign in to an account first.");
            return;
        }
        setShowGoogleSaveModal(state);
        document.body.classList.toggle('overflow-hidden', state);
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

    // TAKE ALL THE DATA FROM DATABASE AND SET IT TO DATA
   async function getAllDB() {
        const imageRecords = await db.images.toArray();
        const allBooks = await db.books.toArray();
        const allCharacters = await db.characters.toArray();
        const allNotes = await db.notes.toArray();

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
            version: "4.0",
            exportedAt: new Date().toISOString(),
            books: allBooks,
            character: allCharacters,
            images: imagesWithBase64,
            allNotes,
        }; 

        return data;
    }

    // EXPORT DATA/SAVE TO Json FILE
    const exportData = async () => {
        const name = prompt("Enter file name");
        if (!name) return;

        const data = await getAllDB();

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
    
    //   // IMPORT DATA/SAVE File
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
            await db.characters.bulkAdd(parsed.character);

            // Restore images (if they exist)
            if (parsed.images && parsed.images.length > 0) {
            const restoredImages = parsed.images.map((img: any) => ({
                imageId: img.imageId,
                charId: img.charId,
                bookId: img.bookId,
                createdAt: img.createdAt,
                imageBlob: base64ToBlob(img.base64),
            }));

            await db.images.bulkAdd(restoredImages);
            }

            alert("Import successful!");
            showModalFile(false);
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Invalid file format");
        }
    };

    // THIS IS FUNCTIONS FOR THE IMPORTING FILE
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setSelectedFile(acceptedFiles[0]); // triggers re-render
    }, []);
    
    // THIS IS FUNCTIONS FOR THE IMPORTING FILE
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
    });

    const name = "Story-Organizer-BackUp-Data"

    // SAVE DATA DB TO GOOGLE DRIVE
    async function backupData() {
        const token = localStorage.getItem("googleAccessToken");
        const existingFile = localStorage.getItem("googleFileID");

        if(!token) {
            alert("Connect to Google first.");
            setGoogleUser(null);
            return;
        }
        const data = await getAllDB();
        

        try {
            setErrorGoogle(null);
            setIsGoogleSaving(true);
            await uploadJsonToDrive(name, data, token, existingFile ?? undefined);
            setSuccessGoogle(true);

            setTimeout(() => {
                showSaveGoogleModal(false);
                setSuccessGoogle(false);
                setIsGoogleSaving(false);
                setShowAccountSettings(false);
            }, 2000);
        } catch (err) {
            console.error(err);
            alert("Upload failed. Try to login again.");
            showSaveGoogleModal(false);
            setIsGoogleSaving(false);
            signIn();
        }

    }

    // IMPORT DATA FROM GOOGLE DRIVE TO LOCAL DB
    const handleRestoreFromDrive = async () => {
        const token = localStorage.getItem("googleAccessToken");
        if (!token || !backupFileId) return;

        const isConfirmed = window.confirm("Download the saved file, it will overwrite the existing data if there are any.");
        if (isConfirmed) {
            try {
                const file = await downloadDriveFile(backupFileId, token);
                await importData(file);
                setShowAccountSettings(false);
            } catch (err) {
                console.error(err);
                alert("Restore failed.");
            }
        }
    };

    async function googleLogout() {
        const isConfirmed = window.confirm("Are you sure you want to log out?");
        if (isConfirmed) {
            setGoogleUser(null);
            signOut(); // Call the actual logout function passed as a prop
            setShowAccountSettings(false);
        }
    }

    // NUKES ALL THE EXISTING FILES IN GOOGLE DRIVE/DELETE ALL
    // async function deleteAllGdrive() {
    // const token = localStorage.getItem("googleAccessToken");
    // if (token) {
    //     await deleteAllBackups(token);
    //     alert("All old backup files deleted!");
    // }
    // }
    
    return (
        <>
            {/* //Title/Menu/HEADER */}
            <header 
                className={`
                fixed top-0 left-0 w-full h-13 z-50
                bg-gray-950 backdrop-blur-md
                transition-transform duration-300 ease-in-out
                `}>
                <div className="flex justify-between place-items-center py-2 px-1 md:py-2 md:px-5 w-full sm:w-full mx-auto">
                
                    {isBookContext ? (
                        <div className="flex items-center text-white min-w-0">
                            <button
                                type="button"
                                onClick={() => navigate(characterSlug ? `/book/${currentBookId}` : "/")}
                                className="px-2 py-1 rounded-l-md hover:bg-white/10 transition"
                                title={characterSlug ? "Back to book" : "Back to library"}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} size="lg"/>
                            </button>

                            <div className="hidden sm:flex border-l border-slate-700 place-items-center">
                                {characterName && (
                                <h2 onClick={() => navigate('/')} title="Back to library" className="text-xl text-gray-400 cursor-pointer hover:text-white border-r border-slate-700 px-1">
                                    <FontAwesomeIcon icon={faHouse} />
                                </h2>
                                )}
                                <h2 className="text-xl truncate px-2">
                                    {bookTitle || "Book"}
                                </h2>
                                <p className="text-lg truncate border-l border-slate-700 pl-2">
                                    {characterName && <span className="text-gray-300">{characterName}</span>}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1
                                className="text-white cursor-pointer hidden md:flex md:text-2xl sm:text-lg"
                                onClick={() => {navigate("/")}}
                            >
                                📖StoryDreamer
                            </h1>

                            <p className="md:hidden flex items-center justify-center text-2xl">📖</p>
                        </>
                    )}

                    {/* THIS DELETES ALL EXISTING FILES IN GOOGLE DRIVE */}
                    {/* <button className="bg-red-500 p-10" onClick={() => deleteAllGdrive()}> NUKE IT ALL NOW</button> */}

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
                                title="Currently in development..." />
                            </div>
                        </div>

                        {/* MOBILE ICON BUTTON */}
                        <button
                        onClick={() => setOpenSearch(true)}
                        className="
                            md:hidden
                            flex items-center justify-center
                            w-10 h-9 group
                            border rounded-md
                            text-white bg-gray-950 
                            hover:bg-gray-200
                            transition
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
                            className="text-gray-400 hover:text-gray-200 transition"
                            >
                            ✕
                            </button>
                        </div>
                        )}

                        <div onClick={toggleTheme} className="h-9 border border-white text-gray-200 rounded-md hover:bg-gray-300 hover:text-gray-950 transition">
                            <button className="hidden dark:block">
                                <span className="group inline-flex shrink-0 justify-center items-center size-8 stroke-2">
                                    <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                                </span>
                            </button>
                            <button className="block dark:hidden">
                                <span className="group inline-flex shrink-0 justify-center items-center size-8 stroke-2">
                                    <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                                </span>
                            </button>
                        </div>

                        {/* CONNECT GOOGLE ACCOUNT FOR BACKUP SAVE */}
                        {googleUser ? (
                        <>
                            <div 
                                className="w-9 h-9 rounded-full overflow-hidden shadow-lg border border-slate-700 transition hover:border-white cursor-pointer"
                                onClick={() => {setShowAccountSettings(prev => !prev); console.log(googleUser.picture);}}
                            >
                            <img
                                src={googleUser.picture}
                                className="w-full h-full object-cover rounded"
                                title={`Account: ${googleUser.name}\n(${googleUser.email})`}
                            />
                            </div>
                        </>
                        ) : (
                            <button
                                onClick={() => setShowAccountSettings(prev => !prev)}
                                className="p-1 transition border border-white text-gray-200 rounded-md hover:bg-gray-300 hover:text-gray-950 transition"
                            >   
                                <FontAwesomeIcon icon={faCircleUser} size="xl" />
                            </button>
                        )}

                        {/* THIS IS THE DROPDOWN WHEN CLICKING SYSTEM FUNCTIONS */}
                        {showAccountSettings && (
                        <div 
                            className="absolute right-5 top-12 z-20 w-63 rounded-md border border-gray-200 bg-white shadow-lg dark:text-white dark:bg-gray-900 dark:border-gray-700 p-2 space-y-2"
                        >
                            {googleUser && (
                                <div className="flex flex-col gap-1 p-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Account
                                    </p> 
                                    
                                    <div className="flex items-center gap-3">
                                        {/* Avatar with improved border and hover effect */}
                                        <div className="group relative w-9 h-9 rounded-full overflow-hidden shadow-md border-2 border-slate-700 transition-all hover:border-blue-500 cursor-pointer">
                                            <img
                                                src={googleUser.picture}
                                                alt={googleUser.name}
                                                className="w-full h-full object-cover"
                                                title={`Account: ${googleUser.name}\n(${googleUser.email})`}
                                            />
                                        </div>

                                        {/* Text stack for better hierarchy */}
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium text-slate-100 leading-none">
                                                {googleUser.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {googleUser.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* EXPORT/IMPORT BUTTON */}
                            <button
                                title="IMPORT/EXPORT FILE"
                                onClick={() => showModalFile(true)}
                                className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <FontAwesomeIcon icon={faFileImport} className="mr-2"/>Download Data
                            </button>

                            {/* THIS IS FOR SAVING TO GOOGLE DRIVE */}
                            <button
                                title="Save data to Gdrive"
                                onClick={() => showSaveGoogleModal(true)}
                                className="w-full text-left px-2 py-1 rounded hover:bg-green-100 dark:hover:bg-gray-700"
                            >
                                <FontAwesomeIcon icon={faUpload} className="mr-2"/>Backup Data
                            </button>

                            {/* DOWNLOAD THE BACKUP FILE FOR DATA UPDATES */}
                            {backupFileId && (
                            <button
                                onClick={() => handleRestoreFromDrive()}
                                title="Import Saved files from gDrive"
                                className="w-full text-left px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40"
                            >
                                <FontAwesomeIcon icon={faDownload} className="mr-2"/>Import Saved
                            </button>
                            )}

                            {googleUser ? 
                                (
                                <>
                                <button
                                    onClick={() => {googleLogout();}}
                                    className="w-full text-left px-2 py-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
                                >   <FontAwesomeIcon icon={faUser} className="mr-2"/>Sign Out
                                </button>
                                </>
                                )
                                :
                                (
                                <>
                                <button
                                    onClick={() => signIn()} 
                                    title="Sign in to your Google Account"
                                    className="w-full text-left px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                >   <FontAwesomeIcon icon={faUser} className="mr-2"/>Sign In
                                </button>
                                </>
                                )
                            }       
                        </div>
                        )}

                    </div>

                </div>
            </header>

            {/* // EXPORT/IMPORT MODAL */}
            {showFileModal && (
                <div 
                className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" 
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                    showModalFile(false);
                    }
                }}>
                <div className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-100 max-h-[90vh] overflow-y-auto p-6 rounded-md shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
                    
                    {/* DOWNLOAD YOUR DATA as JSON */}
                    <div className="flex justify-between">
                    <div>
                        <h2 className="text-x1 font-bold">SAVE YOUR BOOKS</h2>
                        <p className="text-sm text-gray-500">From your impulsive actions, save your file now.</p>
                    </div>
                    <div className="px-2">
                        <button
                        onClick={exportData}
                        className="border bg-blue-500 px-4 py-2 text-white rounded-md hover:border hover:border-blue-900"> 
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
                            <input 
                            {...getInputProps()} 
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
                            className="border bg-blue-500 px-4 py-2 text-white rounded-md hover:border hover:border-blue-900 disabled:opacity-40 disabled:cursor-not-allowed
                            text-white"> 
                            Import Books
                        </button>
                        </div>
                    </div>
                </div>
                </div>
            )}


            {showGoogleSaveModal && googleUser &&(
            <div 
                className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
                onMouseDown={(e) => {
                    if (isGoogleSaving === true) return;
                    if (e.target === e.currentTarget) {
                        setShowGoogleSaveModal(false);
                    }
                }}
            >
                <div 
                    className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-100 max-h-[90vh] overflow-y-auto p-4 rounded-md shadow-lg" onMouseDown={(e) => e.stopPropagation()}
                >
                    <h2 className="text-2xl font-bold">Backup data in Google Drive</h2>
                    <p className="text-base text-gray-500">
                        {googleUser.email} 
                    </p>
                    <p className="text-xl text-black text-center">
                        {name}.json
                    </p>

                    {!successGoogle && !isGoogleSaving && (
                    <>
                        <p className="text-lg text-gray-600 px-5 pt-3">
                            A file with this name already exists on the server. Saving will permanently overwrite the current version. This action is irreversible and previous data cannot be recovered.
                        </p>

                        <p className="text-lg text-gray-600 text-center px-5">
                            Are you sure you want to proceed?
                        </p>
                    </>
                    )}

                    {!successGoogle && (
                        <div className="">
                            {errorGoogle && (
                            <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                                {errorGoogle}
                            </div>
                            )}
                        
                            <div className="flex justify-center gap-5 pt-5 px-3">
                                <button
                                    className="px-3 py-2 rounded-lg bg-red-400 w-full hover:bg-red-500 text-semibold"
                                    onClick={() => !isGoogleSaving && showSaveGoogleModal(false)}
                                    disabled={isGoogleSaving}
                                >
                                Cancel
                                </button>

                                <button
                                    className="px-3 py-2 rounded-lg bg-emerald-400 w-full hover:bg-emerald-500 text-semibold"
                                    onClick={() => backupData()}
                                    disabled={isGoogleSaving}
                                >
                                {isGoogleSaving ? (
                                    <>
                                    <span> <FontAwesomeIcon icon={faSpinner} size="xl" spin /></span>
                                    Saving...
                                    </>
                                ) : (
                                    "Confirm"
                                )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success Animation */}
                    {successGoogle && (
                    <div className="flex flex-col items-center justify-center py-6">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-scaleIn">
                        <svg
                            className="w-8 h-8 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                            />
                        </svg>
                        </div>
                        <p className="text-green-600 font-semibold">
                        Upload Successful!
                        </p>
                    </div>
                    )}

                </div>
            </div>
            )}

        </>
    );
}

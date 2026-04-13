import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport, faCircleUser, faUpload, faSpinner, faDownload, faArrowLeft, faUser, faAngleRight, faLink, faX, faGear, faPanorama, faBomb, faRotate } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../db";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDropzone } from "react-dropzone";

import { useGoogleAuth, type GoogleUser } from "../context/GoogleAuthContext";
import { signOut } from "../services/googleAuth";
import { downloadDriveFile, listManualBackupFiles, listRestoreBackupFiles, type DriveBackupFile, uploadManualBackup, upsertAutoBackup, isTokenActive, deleteAllBackups } from "../services/driveService";

interface HeaderProps {
  showGalaxy: boolean;
  onToggle: () => void;
}

export default function Header({ showGalaxy, onToggle }: HeaderProps) {
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

    const [manualBackups, setManualBackups] = useState<DriveBackupFile[]>([]);
    const [restoreBackups, setRestoreBackups] = useState<DriveBackupFile[]>([]);
    const [selectedBackupId, setSelectedBackupId] = useState<string>("");
    const [displayExpiringAuth, setDisplayExpiringAuth] = useState(false);

    const [tokenAccessStatus, setTokenAccessStatus] = useState<"active" | "expired" | "missing">("missing");
    const [isSigningIn, setIsSigningIn] = useState(false);

    // MODALS
    const [showRestoreBackupModal, setshowRestoreBackupModal] = useState(false);
    const [isRestoringBackup, setIsRestoringBackup] = useState(false);
    const [restoreStatus, setRestoreStatus] = useState<"idle" | "loading" | "success" | "cancelled" | "error">("idle");
    const [restoreStatusMessage, setRestoreStatusMessage] = useState("");

    const toggleTheme = () => {
        setDarkTheme(prev => (prev === "dark" ? "light" : "dark"));
    };

    const [darkTheme, setDarkTheme] = useState(
        localStorage.getItem("theme") || "dark"
    );

    useEffect(() => {
        if (googleUser) return;

        const gUser = localStorage.getItem("googleConnected");
        if (!gUser) return;

        try {
            const parsed = JSON.parse(gUser);
            if (parsed?.email) {
            setGoogleUser(parsed);
            }
        } catch {
            localStorage.removeItem("googleConnected");
        }
    }, [googleUser]);

    useEffect(() => {
        if(!user) return;

        setGoogleUser(user);
    }, [user]);

    const updateTokenAccessStatus = useCallback(() => {
        if (isSigningIn) {
            return tokenAccessStatus;
        }
        const token = localStorage.getItem("googleAccessToken");
        const expiresAtRaw = localStorage.getItem("googleAccessTokenExpiresAt");
        const authState = sessionStorage.getItem("googleAuth");
        const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : NaN;

        if (authState === "pending") {
            return tokenAccessStatus;
        }

        if (!token || Number.isNaN(expiresAt)) {
            setTokenAccessStatus("missing");
            setDisplayExpiringAuth(Boolean(googleUser));
            return "missing" as const;
        }

        const isExpired = Date.now() >= expiresAt;
        const isRevoked = authState === "false";

        if (isExpired || isRevoked) {
            sessionStorage.setItem("googleAuth", "false");
            setTokenAccessStatus("expired");
            setDisplayExpiringAuth(true);
            return "expired" as const;
        }

        setTokenAccessStatus("active");
        setDisplayExpiringAuth(false);
        return "active" as const;
    }, [googleUser, isSigningIn, tokenAccessStatus]);

    useEffect(() => {
        updateTokenAccessStatus();
    }, [googleUser, updateTokenAccessStatus]);

    useEffect(() => {
        if (tokenAccessStatus !== "active") return;

        const expiresAtRaw = localStorage.getItem("googleAccessTokenExpiresAt");
        const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : NaN;

        if (Number.isNaN(expiresAt)) {
            setTokenAccessStatus("missing");
            setDisplayExpiringAuth(Boolean(googleUser));
            return;
        }

        const delayUntilExpiry = Math.max(0, expiresAt - Date.now());
        const timeoutId = window.setTimeout(() => {
            setTokenAccessStatus("expired");
            sessionStorage.setItem("googleAuth", "false");
            setDisplayExpiringAuth(true);
        }, delayUntilExpiry);

        return () => window.clearTimeout(timeoutId);
    }, [tokenAccessStatus, googleUser]);

    useEffect(() => {
        const syncStatus = () => {
            updateTokenAccessStatus();
        };

        window.addEventListener("focus", syncStatus);
        document.addEventListener("visibilitychange", syncStatus);

        return () => {
            window.removeEventListener("focus", syncStatus);
            document.removeEventListener("visibilitychange", syncStatus);
        };
    }, [updateTokenAccessStatus]);

    useEffect(() => {
      const checkBackup = async () => {
        const status = updateTokenAccessStatus();
        const token = localStorage.getItem("googleAccessToken");
        if (googleUser && (status !== "active" || !token)) {
            console.error("Google Authentication Required");
            return;
        }
    
        try {
          const [manualFiles, restoreFiles] = await Promise.all([
            listManualBackupFiles(token!),
            listRestoreBackupFiles(token!),
          ]);
          setManualBackups(manualFiles.slice(0, 3));
          setRestoreBackups(restoreFiles);
          setSelectedBackupId((current) => current || restoreFiles[0]?.id || "");
          setTokenAccessStatus("active");
        } catch {
          console.error("Drive check failed");
          setTokenAccessStatus("expired");
          setDisplayExpiringAuth(true);
        }
      };

    checkBackup();
    }, [user, updateTokenAccessStatus]);

    useEffect(() => {
        const checkBackup = async () => {
            if (isSigningIn) return;
            const status = updateTokenAccessStatus();
            if (status !== "active") return;
            setDisplayExpiringAuth(false);
        };

    checkBackup();
    }, [showAccountSettings, isSigningIn, updateTokenAccessStatus]);
    

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
            alert("Sign in to a google account first.");
            logIn();
            return;
        }
        if(displayExpiringAuth) {
            alert("Google Authentication required.");
            logIn();
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
        const allworldSettings = await db.worldSetting.toArray();

        // Convert blobs to base64
        const imagesWithBase64 = await Promise.all(
        imageRecords.map(async (img) => ({
            imageId: img.imageId,
            charId: img.charId,
            bookId: img.bookId,
            createdAt: img.createdAt,
            base64: await blobToBase64(img.imageBlob),
            isDisplayed: img.isDisplayed,
        }))
        );

        const data = {
            app: "story-organizer",
            version: "5.0",
            exportedAt: new Date().toISOString(),
            books: allBooks,
            character: allCharacters,
            images: imagesWithBase64,
            allNotes,
            allworldSettings,
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
    const importData = async (
        file: File,
        options?: {
            onSuccess?: () => void;
            onError?: (message: string) => void;
            skipSuccessAlert?: boolean;
            skipReload?: boolean;
        }
    ) => {
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            // Clear old data
            await db.books.clear();
            await db.images.clear();
            await db.notes.clear();
            await db.characters.clear();
            await db.worldSetting.clear();

            // Restore data from json
            await db.books.bulkAdd(parsed.books);
            await db.notes.bulkAdd(parsed.allNotes);
            await db.characters.bulkAdd(parsed.character);
            await db.worldSetting.bulkAdd(parsed.allworldSettings);

            // Restore images (if they exist)
            if (parsed.images && parsed.images.length > 0) {
            const restoredImages = parsed.images.map((img: { imageId: number; charId: number; bookId?: string; createdAt: string; base64: string; isDisplayed?: boolean }) => ({
                imageId: img.imageId,
                charId: img.charId,
                bookId: img.bookId,
                createdAt: img.createdAt,
                imageBlob: base64ToBlob(img.base64),
                isDisplayed: img.isDisplayed,
            }));

            await db.images.bulkAdd(restoredImages);
            }

            options?.onSuccess?.();

            if (!options?.skipSuccessAlert) {
                alert("Import successful!");
            }
            showModalFile(false);
            if (!options?.skipReload) {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            const message = "Invalid file format";
            options?.onError?.(message);
            if (!options?.skipSuccessAlert) {
                alert(message);
            }
            throw err;
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

    const manualBackupCountLabel = useMemo(() => `${manualBackups.length}/3 manual backups available`, [manualBackups.length]);

    const formatBackupDate = (value?: string) => {
        if (!value) return "Unknown date";
        return new Date(value).toLocaleString();
    };

    // BACK UP ALL OF THE DATABASE TO GOOGLE DRIVE
    async function refreshManualBackups(token: string) {
        const [manualFiles, restoreFiles] = await Promise.all([
            listManualBackupFiles(token),
            listRestoreBackupFiles(token),
        ]);
        const latestFiles = manualFiles.slice(0, 3);
        setManualBackups(latestFiles);
        setRestoreBackups(restoreFiles);
        setSelectedBackupId(restoreFiles[0]?.id ?? "");
    }

    // BACK UP ALL OF THE DATABASE TO GOOGLE DRIVE
    async function backupData() {
        const token = localStorage.getItem("googleAccessToken");

        if(!token) {
            alert("Connect to Google first.");
            setGoogleUser(null);
            return;
        }
        const data = await getAllDB();

        try {
            setErrorGoogle(null);
            setIsGoogleSaving(true);
            await uploadManualBackup(data, token);
            await refreshManualBackups(token);
            setSuccessGoogle(true);

            setTimeout(() => {
                showSaveGoogleModal(false);
                setSuccessGoogle(false);
                setIsGoogleSaving(false);
                setShowAccountSettings(false);
            }, 1500);
        } catch (err) {
            console.error(err);
            alert("Upload failed. Try to login again.");
            showSaveGoogleModal(false);
            setIsGoogleSaving(false);
            logIn();
        }

    }

    const closeRestoreModal = () => {
        if (isRestoringBackup) return;
        setshowRestoreBackupModal(false);
        document.body.classList.toggle('overflow-hidden', false);
        setRestoreStatus("idle");
        setRestoreStatusMessage("");
    };

    const handleRestoreCancel = () => {
        if (isRestoringBackup) return;
        setRestoreStatus("cancelled");
        setRestoreStatusMessage("Restore cancelled. Your current local data was not changed.");
    };

    // IMPORT DATA FROM GOOGLE DRIVE TO LOCAL DB
    const handleRestoreFromDrive = async () => {
        const token = localStorage.getItem("googleAccessToken");
        if (!token || !selectedBackupId) return;

        const checkAuth = await isTokenActive(token);
        if(!checkAuth) {
            console.error("Google Authentication Required");
            setTokenAccessStatus("expired");
            setDisplayExpiringAuth(true);
            setShowAccountSettings(false);
            setSelectedBackupId("")
            return;
        };

        const selectedBackup = restoreBackups.find((backup) => backup.id === selectedBackupId);

        try {
            setIsRestoringBackup(true);
            setRestoreStatus("loading");
            setRestoreStatusMessage(`Please wait. Restoring ${selectedBackup?.name ?? "your backup"}...`);

            const file = await downloadDriveFile(selectedBackupId, token);
            await importData(file, {
                skipSuccessAlert: true,
                skipReload: true,
                onSuccess: () => {
                    setRestoreStatus("success");
                    setRestoreStatusMessage(`Backup restored successfully from ${selectedBackup?.name ?? "the selected file"}. Reloading now...`);
                },
                onError: (message) => {
                    setRestoreStatus("error");
                    setRestoreStatusMessage(message);
                },
            });

            setShowAccountSettings(false);

            window.setTimeout(() => {
                window.location.reload();
            }, 1400);
        } catch (err) {
            console.error(err);
            setRestoreStatus("error");
            setRestoreStatusMessage("Restore failed. Please try again.");
        } finally {
            setIsRestoringBackup(false);
        }
    };

    const openRestoreModal = () => {
        setRestoreStatus("idle");
        setRestoreStatusMessage("");
        setshowRestoreBackupModal(true);
        document.body.classList.toggle('overflow-hidden', true);
    }

    async function googleLogout() {
        const isConfirmed = window.confirm("Are you sure you want to log out?");
        if (!isConfirmed) return;

        signOut();
        setGoogleUser(null);
        setShowAccountSettings(false);
        setDisplayExpiringAuth(false); // optional cleanup
        setManualBackups([]);
        setRestoreBackups([]);
        setTokenAccessStatus("missing"); // if you use this state
    }

    async function logIn() {
        if (isSigningIn) return;

        setIsSigningIn(true);
        try {
            await signIn();
            setTokenAccessStatus("active");
            setDisplayExpiringAuth(false);
            setShowAccountSettings(false);

        } catch (error) {
            console.error("Login failed or was cancelled:", error);
        } finally {
            setIsSigningIn(false);
        }
    }

    const [autoBackupState, setAutoBackupState] = useState(false)

    // original auto backup
    useEffect(() => {
        if (!googleUser) return;

        const token = localStorage.getItem("googleAccessToken");
        const expiresAtRaw = localStorage.getItem("googleAccessTokenExpiresAt");
        const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : NaN;

        if (!token || Number.isNaN(expiresAt)) return;

        let cancelled = false;
        let timeoutId: number | null = null;
        
        const runAutoBackup = async () => {
            try {
                const data = await getAllDB();
                await upsertAutoBackup(data, token);
                setAutoBackupState(true);
                if (!cancelled) {
                    setDisplayExpiringAuth(false);
                }
            } catch (error) {
                console.error("Automatic Google Drive backup failed", error);
                if (!cancelled) {
                    setDisplayExpiringAuth(true);
                }
            }
        };

        const scheduleAutoBackup = () => {
            const backupLeadTime = 5 * 60 * 1000;
            const delay = expiresAt - Date.now() - backupLeadTime;

            if (delay <= 0) {
                setDisplayExpiringAuth(true);
                return;
            }

            timeoutId = window.setTimeout(() => {
                void runAutoBackup();
            }, delay);
            setDisplayExpiringAuth(false);
        };

        scheduleAutoBackup();

        return () => {
            cancelled = true;
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [googleUser]);

    // BACKING PATH LOCATION PAGES+
    const location = useLocation();
    const isEditPage = location.pathname.endsWith("/edit");

    let backPath = "/";

    if(isEditPage && characterSlug) { //this is the edit page
        backPath = `/book/${currentBookId}/${characterSlug}`;
    } else if (characterSlug && currentBookId) { //this is the char page
        backPath = `/book/${currentBookId}`;
    } else if (!characterSlug && currentBookId) { //this is the book page
        backPath = `/`;
    }

    // NUKES ALL THE EXISTING FILES IN GOOGLE DRIVE/DELETE ALL
    async function deleteAllGdrive() {
        const token = localStorage.getItem("googleAccessToken");
        if (!token) return;

        const isConfirmed = window.confirm("Delete all this account's gdrive backup files?")

        if (isConfirmed === true) {
            await deleteAllBackups(token);
            alert("All old backup files deleted!");
        }
        else {
            return;
        }
    }

    const [openMoreSettings, setOpenMoreSettings] = useState(false);
    
    return (
        <>
            {/* //Title/Menu/HEADER */}
            <header 
                className={`
                fixed top-0 left-0 w-full h-12 z-50
                bg-gray-950 backdrop-blur-md
                transition-transform duration-300 ease-in-out
                `}>
                <div className="flex h-full items-center justify-between px-2 md:px-5 w-full mx-auto gap-2">
                
                    {isBookContext ? (
                        <div className="flex items-center text-white min-w-0 h-full">
                            <div className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-white/10 transition">
                                <button
                                    type="button"
                                    onClick={() => navigate(backPath)}
                                    title={"Back"}
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} size="lg"/>
                                </button>
                            </div>

                            <div className="hidden sm:flex items-center border-l border-slate-700 h-9 pl-4 ml-2 gap-2">
                                <h2 className="text-base font-semibold text-white whitespace-nowrap leading-none">
                                    {bookTitle || "Book"}
                                </h2>

                                {characterName && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <FontAwesomeIcon icon={faAngleRight} className="text-lg" />
                                        <p className="text-base truncate text-gray-100 leading-none">
                                            {characterName}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div 
                                className="flex items-center gap-2 text-white cursor-pointer select-none h-full"
                            >
                                <div className="h-15 overflow-hidden flex items-center">
                                    <img 
                                    src="/textures/logo/logo2.png" 
                                    alt="📖" 
                                    className="w-full h-full object-cover" 
                                    />
                                </div>

                                <div className="h-20 -ml-2 overflow-hidden flex items-center">
                                    <img 
                                    src="/textures/logo/logo3.png" 
                                    alt="Story Dreamer" 
                                    className="w-full h-full object-cover" 
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex gap-2 items-center">
                    
                        {/* search field */}
                        <>
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
                        </>

                        {/* dark mode switch */}    
                        <div 
                            onClick={toggleTheme} 
                            className="h-9 rounded-xl
                            text-white
                            border border-gray-300 hover:bg-gray-800 
                            transition inline-flex items-center justify-center"
                        >
                            <button className="hidden dark:block h-9 w-9">
                                <span className="group inline-flex shrink-0 justify-center items-center size-8 stroke-2">
                                    <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                                </span>
                            </button>
                            <button className="block dark:hidden h-9 w-9">
                                <span className="group inline-flex shrink-0 justify-center items-center size-8 stroke-2">
                                    <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                                </span>
                            </button>
                        </div>

                        {/* CONNECT GOOGLE ACCOUNT FOR BACKUP SAVE */}
                        {googleUser ? (
                        <>
                            <div 
                                className="w-9 h-9 rounded-xl overflow-hidden border border-gray-300 transition hover:bg-gray-800 cursor-pointer select-none"
                                onClick={() => {setShowAccountSettings(prev => !prev);}}
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
                                onClick={() => {setShowAccountSettings(prev => !prev);}}
                                className="h-9 w-9 inline-flex items-center justify-center p-1 transition border border-white text-gray-200 rounded-md hover:bg-gray-300 hover:text-gray-950 transition"
                            >   
                                <FontAwesomeIcon icon={faCircleUser} size="xl" />
                            </button>
                        )}

                        {/* THIS IS THE DROPDOWN WHEN CLICKING SYSTEM FUNCTIONS */}
                        {showAccountSettings && (
                        <>  
                            <div  
                                className="fixed inset-0 z-30 cursor-default h-screen" 
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevents clicking the backdrop from triggering the Card
                                    setShowAccountSettings(false);
                                    setOpenMoreSettings(false);
                            }}
                            />

                            <div 
                                className="absolute right-5 top-12 z-40 w-63 rounded-md border border-gray-200 bg-white shadow-lg dark:text-white dark:bg-gray-900 dark:border-gray-700 py-2 space-y-2"
                            >
                                {/* account info */}
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
                                {!displayExpiringAuth && googleUser ? (
                                <>
                                    <button
                                        title="Create/Save a backup data to Gdrive"
                                        onClick={() => showSaveGoogleModal(true)}
                                        className="w-full text-left px-2 py-1 rounded hover:bg-green-100 dark:hover:bg-gray-700"
                                    >
                                        <FontAwesomeIcon icon={faUpload} className="mr-2"/>Backup Data
                                    </button>

                                    {/* DOWNLOAD THE BACKUP FILE FOR DATA UPDATES */}
                                    <div className="space-y-2 rounded">
                                        <button
                                            onClick={() => {openRestoreModal()}}
                                            title="Restore backup data from google drive save"
                                            className="w-full text-left px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                        >
                                            <FontAwesomeIcon icon={faDownload} className="mr-2"/>Restore backup
                                        </button>
                                    </div>
                                </>
                                ) : (
                                    <button
                                        title="Re-authenticate Google connection to backup/restore data"
                                        onClick={() => logIn()}
                                        className={`${googleUser ? "" : "hidden"} w-full text-left px-2 py-1 rounded hover:bg-green-100 dark:hover:bg-gray-700`}
                                    >
                                        <FontAwesomeIcon icon={faLink} className="mr-2"/>Re-authenticate Google
                                    </button>
                                )}

                                {/* settings... more dropdown options */}
                                {googleUser && (
                                    <div onMouseOver={() => setOpenMoreSettings(true)}
                                        onMouseLeave={() => setTimeout(() => {setOpenMoreSettings(false),3000})}
                                    >
                                        <button
                                            className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                        > 
                                            <FontAwesomeIcon icon={faGear} className="mr-2"/>
                                            Settings
                                        </button>

                                        {openMoreSettings && (
                                        <div>
                                            <div 
                                                className="absolute right-62.5 top-40 z-40 w-63 rounded-md border border-gray-200 bg-white shadow-lg dark:text-white dark:bg-gray-900 dark:border-gray-700 space-y-2"
                                                onMouseOver={() => setOpenMoreSettings(true)}
                                            >
                                                <p className="p-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    Settings
                                                </p>
                                                <button
                                                    className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    onMouseDown={onToggle}
                                                    title="background animation toggle"
                                                > 
                                                    <FontAwesomeIcon icon={faPanorama} className={`mr-2 ${showGalaxy ? 'text-cyan-400 shadow-[0_0_8px_#22d3ee]' : ''}`}/>
                                                    <span>Toggle background</span>
                                                </button>

                                                <button
                                                    className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    onMouseDown={() => alert("There are currently no updates available.")}
                                                > 
                                                    <FontAwesomeIcon icon={faRotate} className="mr-2"/>
                                                    Check for updates...
                                                </button>

                                                {!displayExpiringAuth && googleUser && (
                                                    <button
                                                        className="w-full text-left px-2 py-1 rounded text-red-800 dark:hover:bg-gray-500/20"
                                                        onMouseDown={deleteAllGdrive}
                                                        disabled
                                                    > 
                                                        <FontAwesomeIcon icon={faBomb} className="mr-2"/>
                                                        Delete all gdrive backup
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                )}

                                {/* login/sign out */}
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
                                        onClick={() => logIn()} 
                                        title="Sign in to your Google Account"
                                        className="w-full text-left px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                    >   <FontAwesomeIcon icon={faUser} className="mr-2"/>Sign In
                                    </button>
                                    </>
                                    )
                                }       

                            </div>
                        </>
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
                <div className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto p-6 rounded-md shadow-lg" onMouseDown={(e) => e.stopPropagation()}>

                    {/* DOWNLOAD YOUR DATA as JSON */}
                    <div className="">
                        <div>
                            <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">SAVE PROJECTS</h2>
                            <p className="text-sm text-gray-400">From your impulsive actions, download your file now.</p>
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={exportData}
                                className="flex-1 px-4 py-2.5 w-full rounded font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            > 
                            Download
                            </button>
                        </div>
                    </div>

                    {/* DIVIDER LINE OR */}
                    <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="mx-4 text-sm text-gray-500 font-medium">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-between">
                        <div>
                        <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">EXTRICATE YOUR CHARACTERS</h2>
                        <p className="text-sm text-gray-400">Importing saved files will overwrite the present data.</p>
                        </div>
                    </div>

                    {/* UPLOAD YOUR DOWNLOADED JSON FILE TO use in OTHER BROWSER */}
                    <div className="flex items-center justify-center w-full mt-2">
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
                            <div className="flex flex-col items-center justify-center text-body pt-5 pb-6 text-gray-500 dark:text-gray-400">
                                <svg className="w-8 h-8 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/></svg>
                                <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span></p>
                                <p className="text-xs">Exported file only, Json file.</p>
                            </div>
                            )}
                        </div>
                    </div> 

                    <div className="mt-3">
                        <button
                                disabled={!selectedFile}
                                onClick={() => importData(selectedFile!)}
                                className="flex-1 px-4 py-2.5 w-full rounded font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            > 
                            Import Books
                        </button>
                    </div>
                </div>
                </div>
            )}

            {/* DISPLAYS THE MODAL FOR CONFIRMING THE SAVING OF A BACKUP DATA IN GDRIVE */}
            {showGoogleSaveModal && googleUser &&(
            <div 
                className="fixed inset-0 flex items-center justify-center bg-black/50 z-60"
                onMouseDown={(e) => {
                    if (isGoogleSaving === true) return;
                    if (e.target === e.currentTarget) {
                        setShowGoogleSaveModal(false);
                        document.body.classList.toggle('overflow-hidden', false);
                    }
                }}
            >
                <div 
                    className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto p-4 rounded-md shadow-lg" onMouseDown={(e) => e.stopPropagation()}
                >
                     {/* Header Section */}
                    <div className="p-1 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Backup to Google Drive</h2>

                            <button
                                type="button"
                                className="px-2 py-1 rounded border border-gray-400 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                onClick={() => !isGoogleSaving && showSaveGoogleModal(false)}
                            >
                            Close
                            </button>
                        </div>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{googleUser.email}</p>
                    </div>

                    <div className="p-3 space-y-4">
                        {/* Status Card */}
                        {!successGoogle && (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4 text-center border border-blue-100 dark:border-blue-900/30">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                                    Manual Backup Slots
                                </p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {manualBackupCountLabel}
                                </p>
                            </div>
                        )}

                        {/* Warning/Info Alert */}
                        {!successGoogle && manualBackups.length >= 3 && (
                            <div className="flex gap-3 text-sm text-blue-800 dark:text-blue-200 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                <span className="shrink-0 flex items-center text-blue-400">⚠︎</span>
                                <p>Oldest manual backup will be replaced and deleted after uploading.</p>
                            </div>
                        )}

                        {/* Error Handling */}
                        {!successGoogle && errorGoogle && (
                            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                {errorGoogle}
                            </div>
                        )}

                        {/* Actions */}
                        {!successGoogle && (
                            <div className="flex gap-3 pt-2">

                                <button
                                    className="flex-1 px-4 py-2.5 rounded font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                    onClick={() => backupData()}
                                    disabled={isGoogleSaving}   
                                >
                                    {isGoogleSaving ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        "Backup Now"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

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

            {showRestoreBackupModal && (
            <div
                className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-3"
                onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    closeRestoreModal();
                }
                }}
            >
                <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-md bg-white dark:bg-gray-900 p-4 shadow-2xl notes-scroll" onMouseDown={(e) => e.stopPropagation()}>

                    <div className="space-y-4 px-2 py-2 rounded">
                        <div className="flex justify-between">
                            <p className="text-xl font-semibold text-gray-800 dark:text-white">Restore one of your Google Drive backups.</p>

                            <button
                                type="button"
                                className="px-2 py-1 rounded border border-gray-400 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                onClick={closeRestoreModal}
                            >
                            Close
                            </button>
                        </div>

                        <select
                            value={selectedBackupId}
                            onChange={(e) => setSelectedBackupId(e.target.value)}
                            disabled={isRestoringBackup || restoreStatus === "success"}
                            className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 dark:text-white"
                        >
                            {restoreBackups.map((backup) => (
                                <option key={backup.id} value={backup.id}>
                                    {backup.name === "Story-Organizer-Auto-Backup.json (Automatic)" ?
                                        ( `System Automatic-Backup • ${formatBackupDate(backup.modifiedTime ?? backup.createdTime)}` )
                                        :
                                        ( `User-Backup • ${formatBackupDate(backup.createdTime ?? backup.modifiedTime)}` )
                                    }   
                                </option>
                            ))}
                        </select>

                        {restoreStatus !== "idle" && (
                            <div
                                className={`rounded-md border px-3 py-3 text-sm ${
                                    restoreStatus === "success"
                                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/40 dark:text-green-200"
                                        : restoreStatus === "cancelled"
                                        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                                        : restoreStatus === "error"
                                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
                                        : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {restoreStatus === "loading" && (
                                        <FontAwesomeIcon icon={faSpinner} spin className="mt-0.5" />
                                    )}
                                    {restoreStatus === "success" && (
                                        <span className="mt-0.5 text-base leading-none">✓</span>
                                    )}
                                    {restoreStatus === "cancelled" && (
                                        <span className="mt-0.5 text-base leading-none">!</span>
                                    )}
                                    {restoreStatus === "error" && (
                                        <span className="mt-0.5 text-base leading-none">!</span>
                                    )}
                                    <p>{restoreStatusMessage}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            {restoreStatus === "success" && (
                                <button
                                    onClick={restoreStatus === "success" ? closeRestoreModal : handleRestoreCancel}
                                    disabled={isRestoringBackup}
                                    className="items-end px-3 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                >
                                    Close
                                </button>
                            )}

                            <button
                                onClick={() => handleRestoreFromDrive()}
                                title="Restore backup data from google drive save"
                                disabled={!selectedBackupId || isRestoringBackup || restoreStatus === "success"}
                                className="items-end px-4 py-2.5 rounded font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isRestoringBackup ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="mr-2" spin />
                                        Restoring...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faDownload} className="mr-2"/>Restore backup
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                
                </div>
            </div>
            )}

            {autoBackupState && (
                <div className="fixed w-full sm:w-lg z-60 top-15 left-1/2 transform -translate-x-1/2 bg-teal-100 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-2 shadow-md" role="alert">
                    <div className="flex justify-center">
                        <div className="py-2"><svg className="fill-current h-6 w-6 text-teal-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
                        <div className="flex justify-between items-center w-full">
                            <p className="font-bold sm:mr-4">Automatic system backup upload successfully.</p>
                            <span 
                                className="justify-end cursor-pointer rounded-full px-2 py-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-300/50"
                                onClick={() => setAutoBackupState(false)}
                            >
                                <FontAwesomeIcon icon={faX} size="xs"/>
                            </span>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}

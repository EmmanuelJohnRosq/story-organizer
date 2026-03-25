import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";

import { db, type Character, type EditableCharacter, type Notes, type CharacterDescription, type CharImage, type WorldbuildingSection, type WorldbuildingEntry } from "../db";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {faCheck, faPlus, faMinus, faHouse, faUserPlus, faGlobe, faTableColumns, faWandMagicSparkles, faProjectDiagram, faFileLines, faStar, faUser, faLink, faPalette } from "@fortawesome/free-solid-svg-icons";
import { FiEdit2, FiX } from "react-icons/fi"; // example pencil icon from react
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";

import { useDropzone } from "react-dropzone";
import { createPortal } from "react-dom";

import NotesCollection, { type EditableNote } from "../components/NotesCollection";
import Navbar, { type NavbarAction } from "../components/Navbar";

type CharacterDetailTab = "overview" | "profile" | "relationships" | "appearance";

export default function CharacterPage() {
  const { currentBookId, characterSlug } = useParams();
  const selectedCharacterId = Number(characterSlug?.split("-")[0]);

  const navigate = useNavigate();

  // DO THIS ON PAGE NAVIGATE TO CHECK IF CAN PROCEED
  useEffect(() => { 
    const loadCharacter = async () => {
      if (!selectedCharacterId) {
        navigate(`/book/${currentBookId}`, { replace: true });
        return;
      }

      const character = await db.characters.get(selectedCharacterId);

      if (!character) {
      // Invalid character → redirect
      navigate(`/book/${currentBookId}`, { replace: true });
      return;
      }

      setOriginalCharacter(character);
      setEditingCharacter({ ...character, abilitiesText: character.abilities.join(", ")} as Character & { abilitiesText : string });
    };

    loadCharacter();
    loadCharNotes(selectedCharacterId);
    loadChars(currentBookId!);
    setSelectedCharacter(selectedCharacterId);
  }, [selectedCharacterId]);

  const [character, setCharacters] = useState<Character[]>([]);
  const [charNotes, setCharNotes] = useState<Notes[]>([]);

  // CHARACTER DATA
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<EditableCharacter | null>(null);
  const [charEditing, setcharEditing] = useState(false);
  const [originalCharacter, setOriginalCharacter] = useState<Character | null>(null);
  const [onChange, setonChange ] = useState(false);
  const [showAddCharacter, setShowAddCharacter] = useState(false);

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
  const [imageMap, setImageMap] = useState<Record<string, CharImage[]>>({});

  // CHARACTER UPLOAD IMAGE
  const [uploadCharImage, showUploadCharImage] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // MODALS
  const [showGenImage, setShowGenImage] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  // NOTES MOBILE MODAL
  const [isNotesDrawerMounted, setIsNotesDrawerMounted] = useState(false);
  const [isNotesDrawerVisible, setIsNotesDrawerVisible] = useState(false);

  // IMPORT Variables
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // BOOK DETAILS INITIALIZE
  const [bookTitle, setBookTitle] = useState("");

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

  // ABILITIES WITH DESCRIPTION
const [charAbilities, setCharAbilities] = useState<
  { ability: string; description: string }[]
>([]);

  // CHARACTER Relationships with type
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

  const currentBook = async () => await db.books.get(currentBookId);

  const characterDetailTabs: { key: CharacterDetailTab; label: string; icon: IconDefinition }[] = [
    { key: "overview", label: "Overview", icon: faStar },
    { key: "profile", label: "Profile", icon: faUser },
    { key: "relationships", label: "Relationships", icon: faLink },
    { key: "appearance", label: "Appearance", icon: faPalette },
  ];

  const loadChars = async (bookId : string) => {
    const characters = await db.characters
      .where("bookId")
      .equals(bookId)
      .toArray();

    characters.sort((a, b) => a.id - b.id);
    setCharacters(characters);
    loadImages(characters);
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

  // The main function that accepts a string and returns a processed array
  const stringToArray = (inputString: string) => {
    if (typeof inputString !== 'string') {
      return [];
    }
    return inputString.split(",").map(a => normalizeWhitespace(a));
  };

  // CREATE A CHARACTER THROUGH RELATIONSHIPS... LIKE ADD A MODAL TO ADD A ChARACTER ALREADY IN A RElATIONSHIP WITH THE CERTAIN CHARACTER
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
      priority: 0,
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
    setCharPersonalityTraits("");
    setCharTags("");
    setCharChapterAppearances("");
    setcharCharacterArc("");

    setCharSetRaces("");
    setCharRelationships([]);
    setCharAbilities([]);

    setCharDescription({ ...defaultcharDescription });

    setShowAddCharacter(false);

    setTimeout(() => {setStatePopup(false); setAlert("");}, 2000);
  }

  // Show Edit Modal
  function showModal(state: boolean) {
    setShowGenImage(state);
    document.body.classList.toggle('overflow-hidden', state);
  }

  const notesDrawerTimeoutRef = useRef<number | null>(null);
  const notesFabRef = useRef<HTMLButtonElement | null>(null);
  const notesDrawerPanelRef = useRef<HTMLDivElement | null>(null);
  const [notesShowState, setNotesShowState] = useState(false);

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
    setOriginalCharacter(null);
    setEditingCharacter(null);
    navigate(`/book/${currentBookId}`);
  }

  // open edit Char Modal
  function openEditCharacter(characters: Character) {
    setDraftNote(null);
    // showUploadCharImage(true);

    const selectedCharacter = { ...characters, abilitiesText: characters.abilities.join(", ")
    } as Character & { abilitiesText : string };
    
    setEditingCharacter({ ...selectedCharacter });

    setOriginalCharacter({ ...selectedCharacter });

    setSelectedCharacter(characters.id);
    const charName = characters.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

    const slug = upcaseLetter(charName);

    navigate(`/book/${currentBookId}/${characters.id}-${slug}`);
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
    if (!editingCharacter || !editingCharacter.name.trim() || !originalCharacter) return;
    if (editingCharacter === originalCharacter) return;

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

  async function editCharacter() {
    if(!currentBookId) return;
    if(!editingCharacter) return;
    
    navigate(`/book/${currentBookId}/${editingCharacter.id}-${editingCharacter.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/edit`);
  }

  // DEFAULT CHAR IMAGE FORMAT
  const [char_image] = useState("/textures/char_images/default_char.jpg")

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

  // FILLS THE TEXT PART OF THE IMAGE GENERATION
  useEffect(() => {
    if (!originalCharacter) return;
    setCharDescription(hydrateDescription(originalCharacter.description));
    setCharTraits(originalCharacter.personalityTraits);
  }, [showGenImage]);

  // GENERATE IMAGE TEXT WITH CHARACTER DESCRIPTION
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
  },[uploadCharImage]);

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

  // THIS IS FUNCTIONS FOR THE IMPORTING FILE
  const onDrop = useCallback((acceptedFiles: File[]) => {
      setSelectedFile(acceptedFiles[0]); // triggers re-render
  }, []);
  
  // THIS IS FUNCTIONS FOR THE IMPORTING FILE
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      multiple: false,
  });

  // CONVERT UPLOADED IMAGE TO AN HTML IMAGE ELEMENT TO DISPLAY
  async function convertUploadedImage(imageFile: any) {
    if (!imageFile) return;

    // Initialize FileReader function
    const reader = new FileReader();

    reader.onload = () => {
    const base64Image = reader.result;

    if (typeof base64Image === "string") {
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
    if (!selectedCharacter) return;

      // 1️⃣ Convert image URL to Blob
    const response = await fetch(imageFile);
    const blob = await response.blob();

    // 2️⃣ Save Blob to IndexedDB
    await db.images.add({
      imageId: crypto.randomUUID(),
      bookId: "", //SAVING IMAGE IN DB WITHOUT BOOKID. BOOKID IS ONLY FOR BOOK COVERS
      charId: selectedCharacter,
      imageBlob: blob,
      createdAt: Date.now(),
      isDisplayed: true,
    });

    const newUrl = URL.createObjectURL(blob);

    setImageMap(prev => ({
      ...prev,
      [selectedCharacter]: newUrl
    }));

    setShowGenImage(false);
    setImageUrl(null);
    setcharPrompt("");
    setImageSaved(null);
    setImageFile(null);
    setPreviewUrl(null);

    //PROMPT: A young man, 18 years old. Black and white hair, sharp golden eyes, chiseled face. quite cold and handsome.

  }

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
    
  const notesSubject = "";
  const notesContent = "";

  // DRAFT NOTE/ Blank note for adding new notes
  const [draftNote, setDraftNote] = useState<EditableNote | null>(null);
  const [draftNoteState, setDraftstate] = useState(false);

  async function addDraftNotes() {
    if (draftNote) return;
    if (!selectedCharacter) return;
    
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
      
      setCharNotes(prev => [
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

  const [hideSave, setHideSave] = useState(false);
  // const [notSaved, setNotSaved] = useState(false);
  const [onFocusId, setOnFocusId] = useState("");
  const [noteContent ,setNoteContent] = useState("");

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
      setCharNotes(prev => prev.filter(notes => notes.id !== note.id));
      
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
    setCharNotes(prev => [deletedNote!, ...prev]);

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

  const [worldbuildingSections, setWorldbuildingSections] = useState<WorldbuildingSection[]>([]);
  const [showWorldbuildingModal, setShowWorldbuildingModal] = useState(false);
  const [openWorldSections, setOpenWorldSections] = useState<Record<string, boolean>>({});
  
  const [worldSectionTitle, setWorldSectionTitle] = useState("");
  const [worldDraftEntries, setWorldDraftEntries] = useState<WorldbuildingEntry[]>([{ label: "", value: "" }]);

  const [abilityTooltip, setAbilityTooltip] = useState<number | null>(null);

  const openWorldbuildingModal = () => {
    setWorldSectionTitle("");
    setWorldDraftEntries([{ label: "", value: "" }]);
    setShowWorldbuildingModal(true);
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

  const saveWorldbuildingSection = () => {
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

    setWorldbuildingSections(prev => [
      ...prev,
      {
        id: sectionId,
        bookId: String(currentBookId),
        title: normalizedTitle,
        entries: cleanEntries,
      },
    ]);

    setOpenWorldSections(prev => ({ ...prev, [sectionId]: true }));
    setShowWorldbuildingModal(false);
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
      id: "world-building",
      label: "World",
      icon: faGlobe,
      onClick: () => alert("Currently, in development..."),
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

  return (
    //MAIN PARENT CONTAINER
    <div className="mx-auto w-full max-w-7xl 2xl:max-w-8xl p-2 xxs:pl-20 xxs:p-6">
      <Navbar actions={navbarActions} />
      
      {/* CONTENT CONTAINER */}
      <div className="relative mt-12 xxs:mt-8.5 grid gap-3 xxs:grid-cols-[0.9fr_1.5fr]">
        <div className="pointer-events-none absolute -top-3 left-0 right-0 h-28 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-fuchsia-500/10 blur-xl" />

        {/* LEFT CENTER CONTAINER */}
        <div className="flex-1">

          {/* CHARACTER CARD CONTAINER */}
          {originalCharacter && (
            <div
              className={`${originalCharacter.relationships?.length >= 1 ? "xxs:grid xxs:grid-cols-[auto_1fr]" : "block"} relative notes-scroll max-h-[calc(100vh-5.5rem)] overflow-auto sticky xxs:top-14.5 h-fit rounded-2xl border border-indigo-800/30 bg-white/70 shadow-[0_20px_45px_-20px_rgba(67,56,202,0.45)] backdrop-blur-sm dark:bg-slate-950/60`}
            >
              
              {/* RELATIONSHIP SIDEBAR*/}
              {originalCharacter.relationships?.length >= 1 && (
                <div className="hidden xxs:flex flex-col gap-3 p-2 dark:bg-slate-900/40 border-r border-indigo-800/30 notes-scroll">
                  {/* Optional: Small Label or Icon at top */}
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter writing-mode-vertical text-center mb-1">
                    Related
                  </div>
                  
                  {originalCharacter.relationships?.slice(0,8).map((rel, i) => (
                    <div
                      key={i}
                      className="group relative flex flex-col items-center"
                    >
                      <div 
                        className="w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 border-slate-700 group-hover:scale-110 group-hover:border-indigo-400 transition-all duration-200 cursor-pointer"
                        onClick={() => openCharacterRel(rel.charId)}
                      >
                        <img
                          src={imageMap[rel.charId]?.find(img => img.isDisplayed)?.url ||
                              imageMap[rel.charId]?.[0]?.url ||
                              char_image}
                          className="w-full h-full object-cover"
                          alt="relationship"
                        />
                      </div>
                      {/* Tooltip on hover */}
                      <div className="absolute left-13.5 top-3 scale-0 group-hover:scale-100 transition-all bg-indigo-900 text-white text-[10px] py-1 px-2 rounded-md z-50 whitespace-nowrap shadow-xl">
                      <span>
                        {rel.type || "unknown"}
                      </span>
                      </div>
                    </div>
                    
                  ))}
                </div> 
              )}

              {/* MAIN CHARACTER DETAILS */}
              <div className="rounded-r-2xl bg-gradient-to-b from-indigo-500/[0.06] via-transparent to-transparent overflow-y-auto notes-scroll dark:bg-gradient-to-br dark:from-indigo-800/10 dark:to-gray-900">
                <div className="px-4 py-6">
                  {/* IMAGE */}
                  <div className="flex flex-col items-center">
                    <div className="h-56 w-60 overflow-hidden rounded-2xl border border-slate-300 shadow-lg shadow-slate-500/20 dark:border-slate-700">
                      <img
                        src={imageMap[originalCharacter.id]?.find(img => img.isDisplayed)?.url ||
                              imageMap[originalCharacter.id]?.[0]?.url ||
                              char_image}
                        alt={originalCharacter.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* NAME + ROLE */}
                  <div className="mt-6 text-center">
                    <div className="inline-flex justify-center group w-full px-4">
                      {editingCharacter && charEditing ? (
                        <div className="w-full relative">
                          <input
                            value={editingCharacter.name}
                            onChange={e => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                            onBlur={(e) => {
                              if (e.target.value !== originalCharacter.name) updateCharacter();
                              setcharEditing(false);
                            }}
                            onKeyDown={e => {
                              if (e.key === "Enter") (e.target as HTMLElement).blur();
                              if (e.key === "Escape") setcharEditing(false);
                            }}
                            autoFocus
                            className="w-full rounded-md border-b border-gray-400 bg-transparent text-center text-2xl font-semibold focus:outline-none dark:border-gray-600"
                          />
                        </div>
                      ) : (
                        <div className="w-full relative flex items-center justify-center gap-2">
                          <span className="text-2xl font-semibold text-slate-900 dark:text-white leading-tight">
                            {editingCharacter!.name}
                          </span>
                          <FiEdit2
                            title="Edit Name"
                            className="opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-indigo-400 transition"
                            onClick={() => setcharEditing(true)}
                          />
                        </div>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {originalCharacter.role}
                    </p>

                    {/* STATUS CHIPS */}
                    <div className="flex justify-center gap-2 mt-4 flex-wrap px-2">
                      <span className="px-2 py-0.5 text-[11px] rounded-md bg-emerald-600/10 dark:text-emerald-400 border border-emerald-600/30 uppercase tracking-wide">
                        {originalCharacter.status ?? "Unknown"}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] rounded-md bg-sky-500/10 dark:text-sky-300 border border-sky-700/30 uppercase tracking-wide">
                        {originalCharacter.importance}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] rounded-md dark:bg-slate-500/20 dark:text-slate-100 border border-slate-700/30 uppercase tracking-wide">
                        {upcaseLetter(originalCharacter.setRace[0] || originalCharacter.description.basic.race || "unknown")}
                      </span>
                    </div>
                  </div>

                  <div className="my-4 border-t border-slate-700/30 mx-2" />

                  {/* QUICK INFO */}
                  <div className="px-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500">Quick Info</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Logic for Power, Occupation, Titles... */}
                      {originalCharacter.powerLevel || originalCharacter.occupation || originalCharacter.titles?.length > 0 ? (
                      <>
                        {originalCharacter.powerLevel && (
                          <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs dark:text-indigo-200 border border-indigo-500/20">
                            {originalCharacter.powerLevel}
                          </span>
                        )}

                        {originalCharacter.occupation && (
                          <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs dark:text-indigo-200 border border-indigo-500/20">
                            {originalCharacter.occupation}
                          </span>
                        )}

                        {originalCharacter.titles?.map((title, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs dark:text-indigo-200 border border-indigo-500/20"
                          >
                            {title}
                          </span>
                        ))}
                        </>
                        ) : ( 
                          <span className="text-sm text-gray-700 dark:text-gray-300">Add character details...</span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      
        {/* RIGHT CENTER CONTAINER */}
        <div className="w-full flex-1">

          {/* CHARACTER DATA PAGE / EDIT CHAR DETAILS */}
          { originalCharacter && editingCharacter && (
            <div className="mb-3 rounded-2xl border border-slate-200/70 bg-white/90 pt-3 shadow-[0_20px_45px_-20px_rgba(67,56,202,0.45)] backdrop-blur-sm dark:border-slate-800 dark:bg-gray-900/90">

              {/* CHARACTER CARD AND IMAGE FORMAT */}
              <div
                className="space-y-2"
                onChange={() => setonChange(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    updateCharacter();
                  }
                }}
              >

                <div className="mx-4 mb-1 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500/80 dark:text-indigo-300/80">
                      Character Dossier
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Organized to match your experiment flow and reference-first writing process.
                    </p>
                  </div>
                </div>

                <div className="mx-4 flex items-start justify-between gap-2 border-b border-gray-300 pb-3 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-100/80 to-sky-100/70 p-1.5 dark:border-indigo-700/40 dark:from-indigo-900/40 dark:to-slate-900/60">
                    {characterDetailTabs.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveCharacterTab(tab.key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                          activeCharacterTab === tab.key
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                            : "bg-white/90 text-slate-700 hover:bg-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <FontAwesomeIcon icon={tab.icon} className="text-[11px]" />
                          {tab.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* FUNCTION SETTINGS */}
                  <div className="flex justify-end relative">
                    <button 
                      title="Edit character data"
                      onClick={() => { editCharacter();setShowCharacterActions(false);}}
                      className="text-gray-400 hover:text-white p-1 rounded-lg"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} size="xl"/>
                    </button>
                  </div>

                </div>  

                <div className="space-y-4 px-4 pb-5 pt-1 select-none">
                  {activeCharacterTab === "overview" && (
                    <div className="space-y-2">

                      {/* BACKGROUND */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/30 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Background</label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {originalCharacter.notes
                            ? originalCharacter.notes
                            : "No background added yet."}
                        </p>
                      </div>

                      {/* PERSONALITY TRAITS */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/30 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Personality Traits</label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {originalCharacter.personalityTraits?.length > 0
                            ? originalCharacter.personalityTraits.join(", ")
                            : "No personality traits added."}
                        </p>
                      </div>

                      {/* CORE MOTIVATION */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/30 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Core Motivation</label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {originalCharacter.futureNotes || "No core motivation added yet."}
                        </p>
                      </div>

                      {/* SUMMARY */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/30 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Character Arc Summary</label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {originalCharacter.characterArc || "No character arc summary added."}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeCharacterTab === "profile" && (
                    <div className="space-y-2">
                      {/* RACE */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/40 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Race</label>

                        <div className="flex flex-wrap gap-2 mt-1">
                          {originalCharacter.setRace && originalCharacter.setRace.length > 0 ? (
                            originalCharacter.setRace.map((race, i) => (
                              <span key={i} className="cursor-pointer rounded-2xl bg-indigo-100 px-2 py-1 text-sm text-indigo-700 transition hover:bg-indigo-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-sky-800">
                                {race}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-700 dark:text-gray-300">No race set</span>
                          )}
                        </div>
                      </div>

                      {/* ABILITIES */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/40 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Abilities/Skills</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {originalCharacter.abilities && originalCharacter.abilities.length > 0 ? (
                            originalCharacter.abilities.map((ability, i) => (
                              <div 
                                key={i}  
                                className="relative group select-none"
                              >
                                <span 
                                  className="cursor-pointer rounded-2xl bg-indigo-100 px-2 py-1 text-sm text-indigo-700 transition hover:bg-indigo-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-sky-800"
                                  title={ability.description}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAbilityTooltip(abilityTooltip === i ? null : i);
                                  }}
                                >
                                  {ability.ability}
                                </span>

                                {/* The Tooltip Popover */}
                                {abilityTooltip === i && (
                                  <>
                                    {/* Invisible backdrop to close when clicking outside */}
                                    <div className="fixed inset-0 z-10" onClick={() => setAbilityTooltip(null)} />
                                    
                                    <div 
                                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded-lg bg-gray-900 p-2 text-xs text-white shadow-xl dark:bg-slate-800
                                      animate-in fade-in zoom-in duration-200 origin-bottom"
                                    >
                                      {ability.description || "No description yet."}
                                      {/* Small arrow/tail */}
                                      <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-slate-800" />
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-700 dark:text-gray-300">No ability set</span>
                          )}
                        </div>
                      </div>

                      {/* POWER LEVEL */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/40 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Power System / Power Level</label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {originalCharacter.powerLevel || "No power system details added."}
                        </p>
                      </div>
                        
                      {/* NET WORTH */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/40 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Net Worth</label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {originalCharacter.netWorth || "The char is poor."}
                        </p>
                      </div>

                      {/* TAGS */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/40 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Character Tags</label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {originalCharacter.tags?.length > 0
                            ? originalCharacter.tags.join(",  ")
                            : "No strengths/weaknesses tagged."}
                        </p>
                      </div>

                      {/* TITLES */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/40 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Titles</label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {originalCharacter.titles?.length > 0
                            ? originalCharacter.titles.join(",  ")
                            : "No titles added."}
                        </p>
                      </div>

                      {/* APPEARANCE */}
                      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/40 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-300">Chapter Appearances</label>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {originalCharacter.chapterAppearances?.length > 0
                            ? originalCharacter.chapterAppearances.join(",  ")
                            : "Add chapter appearances."}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeCharacterTab === "relationships" && (
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-fuchsia-50/30 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Filter by type</label>
                        <select
                          className="rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-500 bg-transparent px-2 py-1"
                          value={relationshipTypeFilter}
                          onChange={(e) => setRelationshipTypeFilter(e.target.value)}
                        >
                          <option value="all">All</option>
                          {[...new Set((originalCharacter.relationships ?? []).map(rel => rel.type).filter(Boolean))].map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        {(originalCharacter.relationships ?? [])
                          .filter(rel => relationshipTypeFilter === "all" || rel.type === relationshipTypeFilter)
                          .map((rel, idx) => {
                            const relatedCharacter = character.find(c => c.id === rel.charId);

                            return (
                              <button
                                key={`${rel.charId}-${idx}`}
                                className="w-full flex items-center justify-between p-2 rounded-md bg-gray-200/60 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                                onClick={() => {
                                  if (relatedCharacter) {
                                    openEditCharacter(relatedCharacter);
                                    return;
                                  }

                                  void openCharacterById(rel.charId);
                                }}
                              >
                                <span className="text-left">
                                  <span className="block text-sm font-semibold">{relatedCharacter?.name ?? `Character #${rel.charId}`}</span>
                                  <span className="block text-xs text-gray-600 dark:text-gray-400">{rel.type || "Unknown"}</span>
                                </span>
                                <span className="text-xs text-blue-500">Open</span>
                              </button>
                            );
                          })}

                        {(originalCharacter.relationships ?? []).length === 0 && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">No relationships added.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeCharacterTab === "appearance" && (
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-amber-50/40 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                      {([
                        ["basic", originalCharacter.description?.basic],
                        ["face", originalCharacter.description?.face],
                        ["hair", originalCharacter.description?.hair],
                        ["body", originalCharacter.description?.body],
                        ["extras", originalCharacter.description?.extras],
                      ] as const).map(([section, values]) => (
                        <div key={section} className="rounded-md border border-gray-300 dark:border-gray-700">
                          <button
                            className="w-full flex justify-between items-center px-3 py-2 text-left font-medium capitalize"
                            onClick={() => setOpenAppearanceSections(prev => ({ ...prev, [section]: !prev[section] }))}
                          >
                            <span>{section}</span>
                            <span>{openAppearanceSections[section] ? "−" : "+"}</span>
                          </button>

                          {openAppearanceSections[section] && (
                            <div className="px-3 pb-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                              {Object.entries(values ?? {}).map(([key, value]) => (
                                <p key={key}>
                                  <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1")}: </span>
                                  {value || "—"}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>  

            {/* CLOSER */}
            </div>  
          )}
          
        </div>

      </div>

      {/* Undo Popup */}
      {showUndoPopup && (
        <div className="fixed top-14 left-1/2 bg-blue-500 py-4 px-8 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
          <span>Deleted</span>
          <button 
            className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm font-semibold flex"
            onClick={handleUndo}>
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
        <div className="fixed top-14 left-1/2 bg-blue-500 py-1 px-5 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
          <span>
            {alertMessage}
            <FontAwesomeIcon className="text-green-500" size="lg" icon={faCheck}/>
          </span>
        </div>
      )}

      {/* UPLOAD || GENERATE CHARACTER IMAGE*/}
      {showGenImage && selectedCharacter && (
          <div className="fixed inset-0 flex items-center bg-black/50 z-50 overflow-auto" 
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                showModal(false);
                setImageUrl(null);
                setImageFile(null);
                setPreviewUrl(null);
                showUploadCharImage(true);
              }
            }}
          >
            {/* MAIN MODAL CONTENT */}
            <div className="dark:text-black w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-100 max-h-screen overflow-y-auto rounded-md shadow-lg" onMouseDown={(e) => e.stopPropagation()}>

              {/* EXIT BUTTON AT THE TOP OF MODAL */}
              <div id="Close modal" className="flex justify-end pl-1">

                <button 
                  className="hover:bg-neutral-300/50 rounded-2xl group"
                  onClick={() => {
                    showModal(false);
                    setImageUrl(null);
                    setImageFile(null);
                    setPreviewUrl(null);
                    showUploadCharImage(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-700 dark:text-gray-800 group-hover:text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                  
                  {uploadCharImage ? 
                    ( 
                      // UPLOAD IMAGE
                      <div>
                        {/* UPLOAD YOUR CHARACTER IMAGE */}
                        <div className="flex items-center justify-center w-full">
                          <div 
                            {...getRootProps()}
                            className={`flex flex-col items-center justify-center w-full h-100 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-base cursor-pointer hover:bg-neutral-tertiary-medium ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}>
                              <input {...getInputProps()} 
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                  setImageFile(e.target.files[0]);
                                  }
                                }}
                              />

                              {imageFile ? (
                                <div className="text-lg text-gray-500 truncate max-w-100">
                                  <img
                                    src={previewUrl ?? undefined}
                                    alt="Generated character"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/></svg>
                                    <p className="mb-2 text-sm"><span className="font-semibold">Click to upload character image</span></p>
                                </div>
                              )}
                          </div>
                        </div> 

                        {/* Submit */}
                        <div className="flex pt-3">
                          <button
                            disabled={!imageFile}
                            onClick={() => convertUploadedImage(imageFile)}
                            className="border w-full bg-blue-500 px-4 py-2 text-white rounded-md hover:border hover:border-blue-900
                            text-white"> 
                            Save image
                          </button>
                        </div>
                      </div>
                    ) 
                    :
                    (
                      // GENERATE IMAGE
                      <div>
                        {/* TITLE */}
                        <h2 className="text-2xl font-bold text-gray-800 pb-2">
                          Character Image Generator
                        </h2>

                        {/* ENTER PROMPT */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-3">
                          <form className="flex w-full gap-1">
                            <input
                              type="text"
                              value={charprompt}
                              required
                              onChange={(e) => setcharPrompt(e.target.value)}
                              placeholder="e.g. A space pirate with a mechanical eye"
                              className="flex-1 px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />

                            <button
                              onClick={generateImage}
                              disabled={loading}
                              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                            
                              {loading ? "Generating..." : "Generate"}
                            </button>
                          </form>
                        </div>

                        {/* HANDLE ERROR */}
                        {error && (
                          <div className="text-red-500 text-sm">
                            {error}
                          </div>
                        )}

                        {/* IMAGE PREVIEW */}
                        <div className="w-full flex justify-center">
                          <div className="w-72 h-96 bg-gray-200 rounded-md overflow-hidden shadow-inner flex items-center justify-center">
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

                        {/* SAVE IMAGE TO DB */}
                        <div className="flex justify-center pt-3">
                          <button 
                          disabled={!imageSaved}
                          className="py-2 px-6 w-full rounded-md bg-indigo-200 hover:bg-indigo-300 text-center"
                          onClick={() =>saveImage(imageSaved)}
                          >
                            Save
                          </button>
                          
                        </div>
                        {/* <button onClick={checkimageUsage} className="rounded bg-blue-100 hover:bg-blue-300 p-4"> CHECK PLEASE </button> */}

                      </div>
                    )
                  }

              </div>
              

            </div>
            
          </div>
      )}

      {/* MOBILE NOTES */}
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
                  title="Character Notes"
                  notes={charNotes}
                  draftNote={draftNote}
                  draftNoteState={draftNoteState}
                  noteToDelete={noteToDelete}
                  hideSave={hideSave}
                  onFocusId={onFocusId}
                  noteContent={noteContent}
                  emptyMessage="Add notes, references, future scenarios, book plans, etc..."
                  contentClassName="mt-2 h-[calc(75vh-3.5rem)] xxs:h-[calc(85vh-3.5rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain"
                  onAddDraft={addDraftNotes}
                  onCloseDraft={closeNotesDrawer}
                  onChangeDraft={(content) => setDraftNote(prev => (prev ? { ...prev, content } : prev))}
                  onChangeNote={(noteId, content) => setCharNotes(prev => prev.map(note => note.id === noteId ? { ...note, content } : note))}
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

              </div>

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
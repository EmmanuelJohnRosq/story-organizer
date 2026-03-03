import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";

import { db, type Character, type EditableCharacter, type Notes, type CharacterDescription } from "../db";

import { FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faTrashCan, faCheck, faSpinner, faPlus, faGear } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";

import { FiEdit2, FiX } from "react-icons/fi"; // example pencil icon from react
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";

type CharacterDetailTab = "overview" | "abilities" | "relationships" | "appearance";

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
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  // CHARACTER UPLOAD IMAGE
  const [uploadCharImage, showUploadCharImage] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // MODALS
  const [showGenImage, setShowGenImage] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

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

  const characterDetailTabs: { key: CharacterDetailTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "abilities", label: "Abilities" },
    { key: "relationships", label: "Relationships" },
    { key: "appearance", label: "Appearance" },
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
    console.log("check what came first: upload iamge");
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
      bookId: "", //SAVING IMAGE IN DB WITHOUT BOOKID. BOOKID IS ONLY FOR BOOK COVERS
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

  const [notesShowState, setNotesShowState] = useState(true);

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

  return (
    //MAIN PARENT CONTAINER
    <div className="w-full mx-auto flex justify-center gap-2 pt-15">
      
      {/* LEFT SIDE CONTAINER */}
      <div className="hidden xs:block flex-1 relative">

        {/* CHARACTER CARD IN CHAR PAGE, left side */}
        { originalCharacter && (
        <div className="sticky top-15 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">

          <div className="px-4 py-6 dark:bg-[#0f172a] shadow-lg">

            {/* IMAGE */}
            <div className="flex flex-col items-center">
              <div className="w-40 h-56 rounded-xl overflow-hidden shadow-lg border border-slate-700" onClick={() => console.log(originalCharacter)}>
                <img
                      src={imageMap[selectedCharacterId] || char_image}
                      alt={originalCharacter.name}
                      className="w-full h-full object-cover rounded"
                    />
              </div>
            </div>

            {/* NAME + ROLE */}
            <div className="mt-6 text-center">

              <div className="inline-flex justify-center group w-full">
                {editingCharacter && charEditing ? (
                  <div className="w-full relative">
                    <input
                      value={editingCharacter.name}
                      onChange={e => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                      onBlur={(e) => {
                        if (e.target.value !== originalCharacter.name) {
                          updateCharacter();
                        }
                        setcharEditing(false);
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") (e.target as HTMLElement).blur();
                        if (e.key === "Escape") setcharEditing(false); // cancel edit
                      }}
                      autoFocus
                      className="text-xl text-center border-b border-gray-500 focus:outline-none pr-4"
                    />
                    <FiX
                      onClick={() => {setcharEditing(false); setEditingCharacter({ ...editingCharacter, name: originalCharacter.name });}}
                      className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-red-500 transition"
                    />
                  </div>
                ) : (
                  <div className="w-full relative">
                    <span className="text-xl text-semibold text-center" >{editingCharacter!.name}</span>
                    <FiEdit2
                      title="Edit Name"
                      className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-gray-500 transition"
                      onClick={() => setcharEditing(true)}
                    />
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-400 mt-1">
                {originalCharacter.role}
              </p>

              {/* STATUS + IMPORTANCE */}
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                <span className="px-3 py-1 text-xs rounded-full bg-emerald-600/20 text-emerald-800 dark:text-emerald-400 border border-emerald-600/30">
                  {originalCharacter.status}
                </span>

                <span className="px-3 py-1 text-xs rounded-full bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-700/30">
                  {originalCharacter.importance}
                </span>
              </div>
            </div>

            {/* RACE */}
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">
                RACE
              </h3>

              <div className="flex flex-wrap gap-2">
                {originalCharacter.setRace?.map((race, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded-md"
                  >
                    {race}
                  </span>
                ))}
              </div>
            </div>

            {/* QUICK INFO */}
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">
                QUICK INFO
              </h3>

              <div className="flex flex-wrap gap-2">
                {originalCharacter.powerLevel && (
                  <span className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded-md">
                    {originalCharacter.powerLevel}
                  </span>
                )}

                {originalCharacter.occupation && (
                  <span className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded-md">
                    {originalCharacter.occupation}
                  </span>
                )}

                {originalCharacter.titles?.map((title, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded-md"
                  >
                    {title}
                  </span>
                ))}
              </div>
            </div>

            {/* DIVIDER */}
            <div className="my-8 border-t border-slate-700" />

            {/* RELATIONSHIP PREVIEW */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">
                Related Characters
              </h3>

              <div className="space-y-5 grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {originalCharacter.relationships?.slice(0, 3).map((rel, i) => (
                  <div
                    key={i}
                    className="cursor-pointer place-items-center"
                  >
                    <div>
                      <div 
                        className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-slate-700 hover:scale-103 hover:border-slate-300 transition"
                        onClick={() => { openCharacterRel(rel.charId); }}
                      >
                        <img
                          src={imageMap[rel.charId] || char_image}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {originalCharacter.relationships?.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Add friends to your character...
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>
        )}

      </div>
    
      {/* CENTER CONTAINER */}
      <div className="w-full max-w-3xl mx-auto">

        {/* CHARACTER DATA PAGE / EDIT CHAR DETAILS */}
        { originalCharacter && editingCharacter && (
        <div className="rounded-md shadow-lg pt-3 mb-3 bg-gray-100 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">

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

            <div className="flex justify-between pb-2 mx-2 border-b border-gray-300 dark:border-gray-700">
              <div className="flex flex-wrap gap-2 pb-2">
                {characterDetailTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveCharacterTab(tab.key)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      activeCharacterTab === tab.key
                        ? "bg-blue-700 text-white text-semibold"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-400 dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* FUNCTION SETTINGS */}
              <div className="flex justify-end relative">

                <div className="flex items-center gap-3">
                  {charEditing && <FontAwesomeIcon icon={faSpinner} size="xl" spin />}
                  {!charEditing && <FontAwesomeIcon className="text-emerald-500" icon={faCheck} size="xl" />}

                  <button
                    title="Character actions"
                    className="px-2 py-1 border border-black dark:border-white text-gray-200 rounded-md dark:hover:bg-gray-300 transition group"
                    onClick={() => setShowCharacterActions(prev => !prev)}
                  >
                    <FontAwesomeIcon icon={faGear} className="text-black dark:text-white dark:group-hover:text-gray-800"/>
                  </button>

                  {showCharacterActions && (
                    <div 
                      className="absolute right-0 top-10 z-20 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700 p-2 space-y-2">
                      <button
                        title="Edit character data"
                        onClick={() => {window.alert("EDIT CHARACTER");}}
                        className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-emerald-700/50"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} className="mr-2"/>Edit
                      </button>
                      
                      <button
                        title="upload character image"
                        onClick={() => {setShowGenImage(true); showUploadCharImage(true); setShowCharacterActions(false);}}
                        className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2"/>Upload Image
                      </button>

                      <button
                        title="Generate character image"
                        onClick={() => {setShowGenImage(true); showUploadCharImage(false); setShowCharacterActions(false);}}
                        className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2"/>Generate Image
                      </button>

                      <button
                        onClick={() => {deleteCharacter(editingCharacter.id); setShowCharacterActions(false);}}
                        className="w-full text-left px-2 py-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
                      >
                        <FontAwesomeIcon icon={faTrashCan} className="mr-2"/>Delete Character
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="pr-2 pl-2 pb-4">
              {activeCharacterTab === "overview" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Background</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md pl-3 hover:border"
                      placeholder="Short character summary"
                      value={editingCharacter.notes}
                      onChange={e => setEditingCharacter({ ...editingCharacter, notes: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Personality Traits</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {originalCharacter.personalityTraits?.length > 0
                        ? originalCharacter.personalityTraits.join(", ")
                        : "No personality traits added."}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Core Motivation</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {originalCharacter.futureNotes || "No core motivation added yet."}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Character Arc Summary</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {originalCharacter.characterArc || "No character arc summary added."}
                    </p>
                  </div>
                </div>
              )}

              {activeCharacterTab === "abilities" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Abilities/Skills</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {originalCharacter.abilities?.map((ability, i) => (
                        <span
                          key={i}
                          title={ability.description}
                          className="px-2 py-1 text-sm bg-slate-700 text-slate-200 rounded-2xl hover:bg-sky-800 cursor-pointer"
                        >
                          {ability.ability}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Power System / Power Level</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {originalCharacter.powerLevel || "No power system details added."}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Worth</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {originalCharacter.netWorth || "The char is poor."}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Character Tags</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {originalCharacter.tags?.length > 0
                        ? originalCharacter.tags.join(",  ")
                        : "No strengths/weaknesses tagged."}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Character Titles</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {originalCharacter.titles?.length > 0
                        ? originalCharacter.titles.join(",  ")
                        : "No titles added."}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Chapter Appearances</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {originalCharacter.chapterAppearances?.length > 0
                        ? originalCharacter.chapterAppearances.join(",  ")
                        : "Add chapter appearances."}
                    </p>
                  </div>
                </div>
              )}

              {activeCharacterTab === "relationships" && (
                <div className="space-y-3">
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
                <div className="space-y-2">
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

                {/* THIS IS THE CHARACTER NOTES */}
                <div className="">
                  {[ ...(draftNote ? [draftNote] : []), ...charNotes ].map(notes => (
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
                            setCharNotes(prev =>
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

    {/* MAIN PARENT CONTAINER DIV CLOSER */}
    </div>

  );
}
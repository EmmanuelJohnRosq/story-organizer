import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { db, type Book, type Character, type CharacterDescription, type CharImage, type Notes, type WorldbuildingEntry, type WorldbuildingSection } from "../db";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faCheck, faCircle, faEdit, faGlobe, faHouse, faImages, faMinus, faNoteSticky, faPen, faPlus, faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";
import type { EditableNote } from "../components/NotesCollection";
import NotesCollection from "../components/NotesCollection";
import type { NavbarAction } from "../components/Navbar";
import Navbar from "../components/Navbar";
import RotatingGlobe from "../components/RotatingGlobe";

type EditTab = "profile" | "lore" | "abilities" | "appearance" | "relationships" | "meta";

type ChipEditorProps = {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  disabled?: boolean;
};

type TimeStampProps = {
  label: string;
  date: string;
  type: 'created' | 'modified';
}

const TAG_OPTIONS = [
  "Protagonist",
  "Antagonist",
  "Mentor",
  "Rival",
  "Comic Relief",
  "Noble",
  "Rogue",
  "Mage",
  "Warrior",
  "Healer",
];

function normalizeWhitespace(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function ChipEditor({ label, items, onChange, placeholder, disabled = false }: ChipEditorProps) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const cleaned = normalizeWhitespace(draft);
    if (!cleaned || items.includes(cleaned)) return;
    onChange([...items, cleaned]);
    setDraft("");
  }

  function removeItem(item: string) {
    onChange(items.filter((value) => value !== item));
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <span className="text-xs text-gray-400">No items yet</span>}
        {items.map((item) =>
          disabled ? (
            <span
              key={item}
              className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            >
              {item}
            </span>
          ) : (
            <button
              type="button"
              key={item}
              onClick={() => removeItem(item)}
              className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700 transition hover:bg-red-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-red-900/60"
            >
              {item} ×
            </button>
          )
        )}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addItem();
              }
            }}
            placeholder={placeholder}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export default function CharEditPage() {
  const { currentBookId, characterSlug } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [selectedCharacterId, setSelectedCharId] = useState(Number(characterSlug?.split("-")[0]));

  const [activeTab, setActiveTab] = useState<EditTab>("profile");
  const [book, setBook] = useState<Book | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [originalCharacter, setOriginalCharacter] = useState<Character | null>(null);

  const [alert, setAlert] = useState("");
  const [success, setSuccess] = useState("");

  const [tagOptions, setTagOptions] = useState<string[]>(TAG_OPTIONS);
  const [customTagDraft, setCustomTagDraft] = useState("");
  const [relationshipDraft, setRelationshipDraft] = useState<{ charId: number; type: string }>({ charId: 0, type: "ally" });
  const [relatedCharactersPage, setRelatedCharactersPage] = useState(0);
  const relatedCharactersPerPage = 6;

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [characterImages, setCharacterImages] = useState<CharImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState("");
  const [charImage] = useState("/textures/char_images/default_char.jpg");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageActionError, setImageActionError] = useState(""); 
  const [pendingImageId, setPendingImageId] = useState("");

  const startsInEditMode = pathname.endsWith("/edit");
  const [isEditMode, setIsEditMode] = useState(startsInEditMode);

  const [imageMap, setImageMap] = useState<Record<string, CharImage[]>>({});

  // NOTES SET STATE/VARIABLES
  const [charNotes, setCharNotes] = useState<Notes[]>([]);

  // NOTES MOBILE MODAL
  const [isNotesDrawerMounted, setIsNotesDrawerMounted] = useState(false);
  const [isNotesDrawerVisible, setIsNotesDrawerVisible] = useState(false);

  const notesDrawerTimeoutRef = useRef<number | null>(null);
  const notesFabRef = useRef<HTMLButtonElement | null>(null);
  const notesDrawerPanelRef = useRef<HTMLDivElement | null>(null);
  const [notesShowState, setNotesShowState] = useState(false);

  const [hideSave, setHideSave] = useState(false);
  const [onFocusId, setOnFocusId] = useState("");
  const [noteContent ,setNoteContent] = useState("");

  // POP UP VARIABLES
  const [showUndoPopup, setShowUndoPopup] = useState(false);
  const [showStatePopup, setStatePopup] = useState(false);

  const [deletedNote, setDeletedNote] = useState<Notes | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Notes | null>(null);
  const deleteTimeoutRef = useRef<number | null>(null);

  // DRAFT NOTE/ Blank note for adding new notes
  const [draftNote, setDraftNote] = useState<EditableNote | null>(null);
  const [draftNoteState, setDraftstate] = useState(false);

  // WORLD BUILDING SETSTATES
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

  const [_openWorldSections, setOpenWorldSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!currentBookId || !selectedCharacterId) {
        navigate("/", { replace: true });
        return;
      }

      const [loadedBook, loadedCharacter, loadedCharacters] = await Promise.all([
        db.books.get(currentBookId),
        db.characters.get(selectedCharacterId),
        db.characters.where("bookId").equals(currentBookId).toArray(),
      ]);

      if (!loadedBook || !loadedCharacter) {
        navigate(`/book/${currentBookId}`, { replace: true });
        return;
      }

      setBook(loadedBook);
      setEditingCharacter(loadedCharacter);
      setOriginalCharacter(loadedCharacter);
      setAllCharacters(loadedCharacters);
      loadBookWorldSettings(loadedBook.id);
      loadImages(loadedCharacters);
      setRelatedCharactersPage(0); 
      loadCharNotes(selectedCharacterId);
      setTagOptions(Array.from(new Set([...TAG_OPTIONS, ...loadedCharacter.tags])));
    };

    void loadData();
  }, [currentBookId, selectedCharacterId]);

  useEffect(() => {
    if (!editingCharacter) return;
    const maxPage = Math.max(Math.ceil((editingCharacter.relationships?.length ?? 0) / relatedCharactersPerPage) - 1, 0);
    setRelatedCharactersPage((prev) => Math.min(prev, maxPage));
  }, [editingCharacter, relatedCharactersPerPage]);

  const loadCharacterImages = async () => {
      if (!selectedCharacterId) return;

      const loadedImages = await db.images
        .where("charId")
        .equals(selectedCharacterId)
        .toArray();

      loadedImages.sort((a, b) => b.createdAt - a.createdAt);

      const mapped: CharImage[] = loadedImages.map((image) => ({
        imageId: image.imageId,
        createdAt: image.createdAt,
        url: URL.createObjectURL(image.imageBlob),
        isDisplayed: image.isDisplayed,
      }));

      const displayedImage = mapped.find((image) => image.isDisplayed);
      setCharacterImages(mapped);

      if (displayedImage) {
        setSelectedImageId(displayedImage.imageId);
      } else if (mapped.length > 0) {
        setSelectedImageId(mapped[0].imageId);
      } else {
        setSelectedImageId("");
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

  // FILTERS USER NOTES FOR CHARACTER PAGE
  const loadCharNotes = async (charId: number) => {
    const notes = await db.notes
      .where("charId")
      .equals(charId)
      .toArray();

    notes.sort((a, b) => b.createdAt - a.createdAt);
    setCharNotes(notes);
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

  useEffect(() => {
    void loadCharacterImages();
  }, [selectedCharacterId]);

  useEffect(() => {
    return () => {
      characterImages.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, [characterImages]);

  useEffect(() => {
    setIsEditMode(pathname.endsWith("/edit"));
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (notesDrawerTimeoutRef.current) {
        clearTimeout(notesDrawerTimeoutRef.current);
      }
    };
  }, []);

  // WORLD SECTIONS USE-EFFECTS
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

  const selectedCharacterImage =
    characterImages.find((image) => image.imageId === selectedImageId)?.url || charImage;

  // DEFAULT CHAR IMAGE FORMAT
  const [char_image] = useState("/textures/char_images/default_char.jpg");

  async function openCharacterRel(id: any) {
    const relatedCharacter = allCharacters.find(char => char.id === id);
    
    if (relatedCharacter) {
      openEditCharacter(relatedCharacter);
    } else {
      setSelectedCharId(id);
    }
  }

  // open edit Char Modal
  function openEditCharacter(characters: Character) {

    const selectedCharacter = { ...characters } as Character;
    
    setEditingCharacter({ ...selectedCharacter });

    setOriginalCharacter({ ...selectedCharacter });

    setSelectedCharId(characters.id);
    const charName = characters.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

    const slug = upcaseLetter(charName);

    navigate(`/book/${currentBookId}/${characters.id}-${slug}`);
  }

  async function setDisplayImage(imageId: string) {
    if (!selectedCharacterId) return;

    await db.transaction("rw", db.images, async () => {
      const charImages = await db.images
        .where("charId")
        .equals(selectedCharacterId)
        .toArray();

      await Promise.all(
        charImages.map((image) =>
          db.images.update(image.imageId, {
            isDisplayed: image.imageId === imageId,
          })
        )
      );
    });

    setSelectedImageId(imageId);
    setCharacterImages((prev) =>
      prev.map((image) => ({
        ...image,
        isDisplayed: image.imageId === imageId,
      }))
    );
  }

  async function deleteImage(imageId: string) {
  if (!selectedCharacterId) return;

  const shouldDelete = window.confirm("Delete this image permanently?");
  if (!shouldDelete) return;

  const target = characterImages.find((image) => image.imageId === imageId);

  await db.transaction("rw", db.images, async () => {
    await db.images.delete(imageId);

    const remaining = await db.images
      .where("charId")
      .equals(selectedCharacterId)
      .toArray();

    if (remaining.length === 0) return;

    const hasDisplayed = remaining.some((image) => image.isDisplayed);
    if (!hasDisplayed || target?.isDisplayed) {
      const fallback = remaining.sort((a, b) => b.createdAt - a.createdAt)[0];

      await Promise.all(
        remaining.map((image) =>
          db.images.update(image.imageId, {
            isDisplayed: image.imageId === fallback.imageId,
          })
        )
      );
    }
  });

  await loadCharacterImages();

  if (pendingImageId === imageId) {
    setPendingImageId("");
  }
  }

  async function confirmDisplayImage() {
    if (!pendingImageId) return;
    await setDisplayImage(pendingImageId);
  }

  async function saveImageBlob(blob: Blob) {
    const newImageId = crypto.randomUUID();
    const createdAt = Date.now();

    await db.transaction("rw", db.images, async () => {
      await db.images
        .where("charId")
        .equals(selectedCharacterId)
        .modify({ isDisplayed: false });

      await db.images.add({
        imageId: newImageId,
        bookId: "",
        charId: selectedCharacterId,
        imageBlob: blob,
        createdAt,
        isDisplayed: true,
      });
    });

    await loadCharacterImages();
    setSelectedImageId(newImageId);
    setImageActionError("");
  }

  async function onUploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    await saveImageBlob(file);
    event.target.value = "";
  }

  async function generateImageFromPrompt() {
    const prompt = normalizeWhitespace(imagePrompt || `${editingCharacter?.name ?? "character"} fantasy portrait`);
    if (!prompt) return;

    if (typeof puter === "undefined" || !puter?.ai?.txt2img) {
      setImageActionError("Image generation is unavailable in this environment.");
      return;
    }

    try {
      setIsGeneratingImage(true);
      setImageActionError("");
      const generated = await puter.ai.txt2img(prompt, { model: "gpt-image-1.5" });
      const response = await fetch(generated.src);
      const blob = await response.blob();
      await saveImageBlob(blob);
    } catch {
      setImageActionError("Failed to generate image. Try another prompt.");
    } finally {
      setIsGeneratingImage(false);
    }
  }

  const missingFields = useMemo(() => {
    if (!editingCharacter) return [] as string[];

    const checks: { label: string; value: unknown }[] = [
      { label: "Role", value: editingCharacter.role },
      { label: "Status", value: editingCharacter.status },
      { label: "Importance", value: editingCharacter.importance },
      { label: "Occupation", value: editingCharacter.occupation },
      { label: "Power Level", value: editingCharacter.powerLevel },
      { label: "Backstory Notes", value: editingCharacter.notes },
      { label: "Future Notes", value: editingCharacter.futureNotes },
      { label: "Character Arc", value: editingCharacter.characterArc },
      { label: "First Chapter Appearance", value: editingCharacter.chapters },
      { label: "Net Worth", value: editingCharacter.netWorth },
      { label: "Chapter Appearances", value: editingCharacter.chapterAppearances.length},
      { label: "Titles", value: editingCharacter.titles.length },
      { label: "Traits", value: editingCharacter.personalityTraits.length },
      { label: "Tags", value: editingCharacter.tags.length },
      { label: "Abilities", value: editingCharacter.abilities.length },
      { label: "Relationships", value: editingCharacter.relationships.length },
      { label: "Appearance • Age", value: editingCharacter.description.basic.age },
      { label: "Appearance • Race", value: editingCharacter.description.basic.race },
      { label: "Appearance • Gender", value: editingCharacter.description.basic.gender },
      { label: "Appearance • Body Type", value: editingCharacter.description.body.bodyType },
      { label: "Appearance • Height", value: editingCharacter.description.body.height },
      { label: "Appearance • Skin Tone", value: editingCharacter.description.body.skinTone },
      { label: "Appearance • Eye Color", value: editingCharacter.description.face.eyeColor },
      { label: "Appearance • Eye Shape", value: editingCharacter.description.face.eyeShape },
      { label: "Appearance • Face Shape", value: editingCharacter.description.face.faceShape },
      { label: "Appearance • Mouth Size", value: editingCharacter.description.face.mouthSize },
      { label: "Appearance • Nose Shape", value: editingCharacter.description.face.noseShape },
      { label: "Appearance • Hair Color", value: editingCharacter.description.hair.hairColor },
      { label: "Appearance • Hair Style", value: editingCharacter.description.hair.hairStyle },
      { label: "Appearance • Accessories", value: editingCharacter.description.extras.accessories },
      { label: "Appearance • Clothing Style", value: editingCharacter.description.extras.clothingStyle },
      { label: "Appearance • Distinguishing Features", value: editingCharacter.description.extras.distinguishingFeatures },
    ];

    return checks
      .filter((item) => {
        if (typeof item.value === "number") return item.value <= 0;
        if (Array.isArray(item.value)) return item.value.length === 0;
        return !String(item.value ?? "").trim();
      })
      .map((item) => item.label);
  }, [editingCharacter]);

  const completion = useMemo(() => {
    if (!editingCharacter) return 0;

    const checks = [
      editingCharacter.name,
      editingCharacter.role,
      editingCharacter.notes,
      editingCharacter.characterArc,
      editingCharacter.status,
      editingCharacter.chapters,
      editingCharacter.futureNotes,
      editingCharacter.importance,
      editingCharacter.occupation,
      editingCharacter.netWorth,
      editingCharacter.powerLevel,
      editingCharacter.tags.length > 0 ? "ok" : "",
      editingCharacter.titles.length > 0 ? "ok" : "",
      editingCharacter.abilities.length > 0 ? "ok" : "",
      editingCharacter.personalityTraits.length > 0 ? "ok" : "",
      editingCharacter.relationships.length > 0 ? "ok" : "",
      editingCharacter.setRace.length > 0 ? "ok" : "",
      editingCharacter.chapterAppearances.length > 0 ? "ok" : "",
      editingCharacter.description.basic.age,
      editingCharacter.description.basic.race,
      editingCharacter.description.basic.gender,
      editingCharacter.description.body.bodyType,
      editingCharacter.description.body.height,
      editingCharacter.description.body.skinTone,
      editingCharacter.description.face.eyeColor,
      editingCharacter.description.face.eyeShape,
      editingCharacter.description.face.faceShape,
      editingCharacter.description.face.mouthSize,
      editingCharacter.description.face.noseShape,
      editingCharacter.description.hair.hairColor,
      editingCharacter.description.hair.hairStyle,
      editingCharacter.description.extras.accessories,
      editingCharacter.description.extras.clothingStyle,
      editingCharacter.description.extras.distinguishingFeatures,
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [editingCharacter]);

  if (!editingCharacter || !book) {
    return <div className="p-6 text-gray-500">Loading character builder...</div>;
  }

  async function saveCharacter() {
    if (!currentBookId || !editingCharacter) return;
    if (editingCharacter === originalCharacter) {
      setAlert("No changes made.");
      setTimeout(() => setAlert(""), 2500);
      return;
    };
    if(!editingCharacter.name) {
      setAlert("Character name required...");
      setTimeout(() => setAlert(""), 2500);
      return;
    }

    const cleanedCharacter: Character = {
      ...editingCharacter,
      name: normalizeWhitespace(editingCharacter.name),
      role: normalizeWhitespace(editingCharacter.role),
      occupation: normalizeWhitespace(editingCharacter.occupation),
      status: normalizeWhitespace(editingCharacter.status),
      importance: normalizeWhitespace(editingCharacter.importance),
      powerLevel: normalizeWhitespace(editingCharacter.powerLevel),
      netWorth: normalizeWhitespace(editingCharacter.netWorth),
      chapters: normalizeWhitespace(editingCharacter.chapters),
      updatedAt: Date.now(),
    };

    await db.characters.update(cleanedCharacter.id, cleanedCharacter);

    setEditingCharacter(cleanedCharacter);
    setOriginalCharacter(cleanedCharacter);
    setSuccess("Character progression saved!");
    setTimeout(() => setSuccess(""), 1800);
  }

  // delete character block
  async function deleteCharacter(characterId: number) {
    if (!currentBookId || !editingCharacter) return;

    const confirmed = window.confirm("Remove this character? No takebacks.");

    if (!confirmed) return;

    // THIS DELETES USING PRIMARY KEY/CHARACTER ID
    await db.characters.delete(characterId);

    setOriginalCharacter(null);
    setEditingCharacter(null);
    navigate(`/book/${currentBookId}`);
  }

  function updateDescription(path: keyof CharacterDescription, key: string, value: string) {
    setEditingCharacter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        description: {
          ...prev.description,
          [path]: {
            ...prev.description[path],
            [key]: value,
          },
        },
      };
    });
  }

  function toggleChecklist(value: string, list: string[], onChange: (items: string[]) => void) {
    if (list.includes(value)) {
      onChange(list.filter((item) => item !== value));
      return;
    }
    onChange([...list, value]);
  }

  const openNotesDrawer = () => {
    if (notesDrawerTimeoutRef.current) {
      clearTimeout(notesDrawerTimeoutRef.current);
      notesDrawerTimeoutRef.current = null;
    }

    setIsNotesDrawerMounted(true);
    setNotesShowState(true);

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

  async function addDraftNotes() {
    if (draftNote) return;
    if (!selectedCharacterId) return;
    
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
        charId: selectedCharacterId ? selectedCharacterId : null,
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

  const tabs: { key: EditTab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "lore", label: "Lore" },
    { key: "abilities", label: "Abilities" },
    { key: "appearance", label: "Appearance" },
    { key: "relationships", label: "Relationships" },
    { key: "meta", label: "Meta" },
  ];

  function showImageModal(state: boolean) {
    setShowImagePicker(state);
    document.body.classList.toggle('overflow-hidden', state);
  }

  const upcaseLetter = (word: string) => {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  const Badge = ({ children, color }: { children: React.ReactNode, color: 'purple' | 'emerald' | 'sky' | 'slate' }) => {
    const colors = {
      purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      slate: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    };
    return (
      <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${colors[color]}`}>
        {children}
      </span>
    );
  };

  const StatTag = ({ children }: { children: React.ReactNode }) => (
    <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-black dark:text-gray-200 border border-indigo-500/20 text-[11px] font-medium">
      {children} 
    </span>
  );

  const TimeCard = ({ label, date, type }: TimeStampProps) => (
    <div className="group relative flex items-center gap-3 rounded-xl border border-gray-400 dark:border-white/5 dark:bg-white/[0.08] p-3 transition-all dark:hover:bg-white/[0.1] hover:border-blue-500/30">
      {/* Visual Icon with Glow */}
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border shadow-inner ${
        type === 'created' 
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
          : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
      }`}>
        {type === 'created' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        ) : (
          <div className="relative">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {/* Breathing "Live" Indicator for Modified */}
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
        )}
      </div>

      {/* Text Data */}
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-300 transition-colors">
          {label}
        </span>
        <span className="text-xs font-mono font-medium text-black dark:text-slate-300">
          {/* Replace with your actual date formatting logic */}
          {date || "Unknown"}
        </span>
      </div>

      {/* Hover "Full Date" Tooltip Style */}
      <div className="absolute -bottom-8 left-0 hidden rounded bg-slate-900 px-2 py-1 text-[10px] text-slate-400 shadow-xl group-hover:block border border-white/10 z-10">
        Full ISO: {new Date().toISOString().split('T')[0]}
      </div>
    </div>
  );

  // date format change
  const formatDate = (dateInput: any) => {
    if (!dateInput) return "Unknown";
    
    const d = new Date(dateInput);
    
    // Check if date is actually valid to prevent "Invalid Date" showing up
    if (isNaN(d.getTime())) return "Format Error";

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  };

  // time format change
  const getRelativeTime = (dateInput: any) => {
    const d = new Date(dateInput);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    return formatDate(dateInput); // Fallback to normal date if > 1 day
  };

  const activeWorldSection = worldbuildingSections.find(section => section.id === activeWorldSectionId) ?? null;

  const openWorldAtlas = () => {
    setShowWorldAtlas(true);
    setShowEditWorldbuildingModal(false);
    setShowWorldbuildingModal(false);
  };

  const closeWorldAtlas = () => {
    setShowWorldAtlas(false);
    setShowWorldbuildingModal(false);
    closeEditWorldbuildingModal();
  };

  const openWorldbuildingModal = () => {
    setShowEditWorldbuildingModal(false);
    openWorldAtlas();
    setWorldSectionTitle("");
    setShowWorldbuildingModal(true);
    setWorldDraftEntries([{ label: "", value: "" }]);
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
    if (!sectionId) return;
    if (worldbuildingSections.length < 1) return;

    const section = worldbuildingSections.find(item => item.id === sectionId);
    if (!section) return;

    setShowWorldbuildingModal(false);
    setShowEditWorldbuildingModal(true);

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

    setWorldSectionTitle("");
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
      id: "edit-mode",
      label: isEditMode ? "Edit" : "View",
      icon: faEdit,
      onClick: toogleEditMode,
      title: "Switch edit mode",
    },
    {
      id: "open-notes",
      label: "Notes",
      icon: faNoteSticky,
      onClick: displayNotes,
      title: "Open notes",
    },
    {
      id: "world-building",
      label: "World",
      icon: faGlobe,
      onClick: () => showWorldAtlas ? closeWorldAtlas() : openWorldAtlas(),
      isActive: showWorldAtlas,
      title: "Open world atlas",
    },
    // {
    //   id: "dashboard",
    //   label: "Dashboard",
    //   icon: faTableColumns,
    //   onClick: () => window.alert("Currently, in development..."),
    //   badge: "Soon",
    //   title: "Dashboard",
    // },
    // {
    //   id: "ai-assist",
    //   label: "AI",
    //   icon: faWandMagicSparkles,
    //   onClick: () => window.alert("Currently, in development..."),
    //   badge: "Soon",
    //   title: "AI-assist",
    // },
    // {
    //   id: "character-graph",
    //   label: "Graph",
    //   icon: faProjectDiagram,
    //   onClick: () => window.alert("Currently, in development..."),
    //   badge: "Soon",
    //   title: "Characters map graph",
    // },
    // {
    //   id: "chapter-prep",
    //   label: "Prepare",
    //   icon: faFileLines,
    //   onClick: () => window.alert("Currently, in development..."),
    //   badge: "Soon",
    //   title: "Chapter Preparation workspace",
    // },
  ];

  function toogleEditMode() {
    const hasChanges = JSON.stringify(editingCharacter) !== JSON.stringify(originalCharacter);

    if (hasChanges) {
      window.alert("Unsaved changes detected.");
      return;
    }

    setIsEditMode((prev) => !prev);
  }

  return (
    // MAIN EDIT PAGE CONTAINER
    <div className="mx-auto w-full max-w-full xxs:max-w-7xl p-4 mt-10 xxs:pl-20 pb-14 xxs:pb-3">
      <Navbar actions={navbarActions} />

      {/* HERO CARD HEADER */}
      <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 dark:bg-slate-900/40 p-6 shadow-lg backdrop-blur-md ring-1 ring-white/5">
        
        {/* Modern Gradient Orbs */}
        <div className={`absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full ${isEditMode ? "bg-blue-500/50" : "bg-cyan-500/30"}  blur-[80px]`} />
        <div className={`absolute -left-16 -bottom-16 -z-10 h-64 w-64 rounded-full ${isEditMode ? "bg-cyan-500/30" : "bg-blue-500/50"} blur-[80px]`} />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          
          {/* Left Side: Identity */}
          <div className="flex flex-1 flex-col sm:flex-row items-start gap-6">
            {/* Avatar with Glass Border */}
            <div className="flex w-full justify-center sm:w-fit sm:justify-start">
              <button
                type="button"
                onClick={() => isEditMode && showImageModal(true)}
                disabled={!isEditMode}
                className="group relative h-44 w-32 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-800 shadow-2xl transition-all duration-300 hover:border-indigo-500/50 disabled:cursor-default"
              >
                <img
                  src={selectedCharacterImage}
                  alt={editingCharacter.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {isEditMode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                    <FontAwesomeIcon icon={faImages} className="text-white text-xl" />
                  </div>
                )}
              </button>
            </div>

            {/* Identity Info */}
            <div className="flex-1 py-1">
              <div className="w-full place-items-center sm:w-fit sm:place-items-start">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`text-[12px] font-bold uppercase tracking-[0.2em] ${isEditMode ? "text-cyan-400" : "text-blue-300"}`}>
                    <span>Character Profile</span>
                    <FontAwesomeIcon icon={faCircle} className="text-[5px] mb-0.5 mx-2" beatFade/>
                    {isEditMode ? "Editing Mode" : "Browsing Mode"}
                  </div>
                </div>
                <h1 className="text-3xl font-black tracking-tight dark:text-white sm:text-4xl line-clamp-4">
                  {editingCharacter.name || "Unnamed Character"}
                </h1>
                <div className="mt-2 flex items-center gap-2">
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge color="emerald">{editingCharacter.status || "Unknown"}</Badge>
                    <Badge color="purple">{editingCharacter.role || "Unknown"}</Badge>
                    <Badge color="sky">{editingCharacter.importance || "Unknown"}</Badge>
                    <Badge color="slate">{upcaseLetter(editingCharacter.setRace[0] || "Unknown")}</Badge>
                    {editingCharacter.setRace.length > 2 && (
                      <Badge color="slate">+{editingCharacter.setRace.length - 2}</Badge>
                    )}
                  </div>
                  
                </div>
              </div>

              <div className="">
                <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500">Stats:</span>
                <div className="flex gap-2 w-fit">
                  <div className="flex flex-wrap gap-2">
                    {editingCharacter.powerLevel && <StatTag>{editingCharacter.powerLevel}</StatTag>}
                    {editingCharacter.occupation && <StatTag>{editingCharacter.occupation}</StatTag>}
                    {editingCharacter.titles?.slice(0, 2).map((t, i) => (
                      <StatTag key={i}>{t}</StatTag>
                    ))}

                    {editingCharacter.titles.length > 2 && (
                      <StatTag>+{editingCharacter.titles.length - 2}</StatTag>
                    )}

                    {!editingCharacter.powerLevel && !editingCharacter.occupation && editingCharacter.titles?.length < 1 && (
                      <StatTag>{"No stats yet"}</StatTag>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: System Metadata (1/8th style sidebar) */}
          <div className="flex flex-col gap-3 lg:w-64">
            <button
              type="button"
              onClick={() => toogleEditMode()}
              className={`flex group items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                isEditMode 
                ? "bg-cyan-700 text-white shadow-sm shadow-cyan-500/40 hover:bg-cyan-600" 
                : "bg-blue-700 text-white shadow-blue-500/40 hover:bg-blue-600"
              }`}
            >
              <FontAwesomeIcon icon={isEditMode ? faToggleOn : faToggleOff} className="group-hover:text-white"/>
              {isEditMode ? "Back to Browse Mode" : " Enable Editing Mode"}
            </button>

            <div className="p-1 space-y-1">
              <div className="flex flex-col gap-1">
                <TimeCard label="System Entry" date={formatDate(editingCharacter.createdAt)} type="created" />
              </div>
              <div className="flex flex-col gap-1">
                <TimeCard label="Last Updated" date={getRelativeTime(editingCharacter.updatedAt)} type="modified" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* TABS EDITABLE CONTENT */}
      <div className="mt-3 grid gap-4 lg:grid-cols-[1.65fr_0.8fr]">
        
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-blue-700 text-white hover:bg-blue-800"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            {activeTab === "profile" && (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm"><span className="font-medium text-gray-600 dark:text-gray-500">Name</span><input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Name" value={editingCharacter.name} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })} /></label>
                <label className="space-y-1 text-sm"><span className="font-medium text-gray-600 dark:text-gray-500">Role</span><input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Role" value={editingCharacter.role} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, role: e.target.value })} /></label>
                <label className="space-y-1 text-sm"><span className="font-medium text-gray-600 dark:text-gray-500">Status</span><input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Status" value={editingCharacter.status} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, status: e.target.value })} /></label>
                <label className="space-y-1 text-sm"><span className="font-medium text-gray-600 dark:text-gray-500">Importance</span><input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Importance" value={editingCharacter.importance} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, importance: e.target.value })} /></label>
                <label className="space-y-1 text-sm"><span className="font-medium text-gray-600 dark:text-gray-500">Occupation</span><input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Occupation" value={editingCharacter.occupation} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, occupation: e.target.value })} /></label>
                <label className="space-y-1 text-sm"><span className="font-medium text-gray-600 dark:text-gray-500">Power Level</span><input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Power Level" value={editingCharacter.powerLevel} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, powerLevel: e.target.value })} /></label>
                <label className="space-y-1 text-sm"><span className="font-medium text-gray-600 dark:text-gray-500">Net Worth</span><input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Net Worth" value={editingCharacter.netWorth} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, netWorth: e.target.value })} /></label>
                <label className="space-y-1 text-sm"><span className="font-medium text-gray-600 dark:text-gray-500">First Chapter Appearance</span><input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="First chapter appearance" value={editingCharacter.chapters} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, chapters: e.target.value })} /></label>

                <div className="md:col-span-2">
                  <ChipEditor disabled={!isEditMode} label="Titles" items={editingCharacter.titles} onChange={(titles) => setEditingCharacter({ ...editingCharacter, titles })} placeholder="Add title" />
                </div>
                <div className="md:col-span-2">
                  <ChipEditor disabled={!isEditMode} label="Personality traits" items={editingCharacter.personalityTraits} onChange={(personalityTraits) => setEditingCharacter({ ...editingCharacter, personalityTraits })} placeholder="Add trait" />
                </div>
                <div className="md:col-span-2">
                  <ChipEditor disabled={!isEditMode} label="Chapter appearances" items={editingCharacter.chapterAppearances} onChange={(chapterAppearances) => setEditingCharacter({ ...editingCharacter, chapterAppearances })} placeholder="e.g. Ch. 8" />
                </div>
              </div>
            )}

            {activeTab === "lore" && (
              <div className="space-y-3">
                <label className="space-y-1 text-sm block"><span className="font-medium text-gray-600 dark:text-gray-300">Backstory Notes</span><textarea rows={6} className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Backstory notes" value={editingCharacter.notes} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, notes: e.target.value })} /></label>
                <label className="space-y-1 text-sm block"><span className="font-medium text-gray-600 dark:text-gray-300">Future Notes</span><textarea rows={4} className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Future notes" value={editingCharacter.futureNotes} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, futureNotes: e.target.value })} /></label>
                <label className="space-y-1 text-sm block"><span className="font-medium text-gray-600 dark:text-gray-300">Character Arc</span><textarea rows={5} className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="Character arc" value={editingCharacter.characterArc} disabled={!isEditMode} onChange={(e) => setEditingCharacter({ ...editingCharacter, characterArc: e.target.value })} /></label>
              </div>
            )}

            {activeTab === "abilities" && (
              <div className="space-y-3">
                {editingCharacter.abilities.map((ability, index) => (
                 <div key={index} className="relative rounded-lg border border-gray-200 p-3 dark:border-gray-700">

                    <button 
                      type="button"
                      hidden={!isEditMode} disabled={!isEditMode}
                      onClick={() => setEditingCharacter({ ...editingCharacter, abilities: editingCharacter.abilities.filter((_, itemIndex) => itemIndex !== index) })}
                      className="
                      absolute right-2 -top-2 text-xs 
                      text-red-500/60 hover:scale-110 hover:text-red-500 
                      cursor-pointer 
                      bg-white dark:bg-gray-900 px-2"
                    >
                      Delete
                    </button>

                    <div className="flex gap-2">
                      <input className="w-1/3 rounded-lg border p-2 dark:bg-gray-800" value={ability.ability} placeholder="Ability" onChange={(event) => {
                        const next = [...editingCharacter.abilities];
                        next[index] = { ...next[index], ability: event.target.value };
                        setEditingCharacter({ ...editingCharacter, abilities: next });
                      }} 
                        disabled={!isEditMode}
                      />
                      <textarea className="w-full rounded-lg border p-2 dark:bg-gray-800" rows={2} value={ability.description} placeholder="Ability description" onChange={(event) => {
                        const next = [...editingCharacter.abilities];
                        next[index] = { ...next[index], description: event.target.value };
                        setEditingCharacter({ ...editingCharacter, abilities: next });
                      }} 
                        disabled={!isEditMode}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <button hidden={!isEditMode} type="button" disabled={!isEditMode} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={() => setEditingCharacter({ ...editingCharacter, abilities: [...editingCharacter.abilities, { ability: "", description: "" }] })}>+ Add Ability</button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                {Object.entries(editingCharacter.description).map(([section, values]) => (
                  <div key={section} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">{section}</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      {Object.entries(values).map(([key, value]) => (
                        <label key={key} className="space-y-1 text-sm">
                          <span className="block font-medium text-gray-600 capitalize dark:text-gray-300">{key.replace(/([A-Z])/g, " $1")}</span>
                          <input
                            className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80"
                            placeholder={key}
                            value={value}
                            disabled={!isEditMode}
                            onChange={(event) => updateDescription(section as keyof CharacterDescription, key, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "relationships" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700" hidden={!isEditMode}>
                  <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <label className="space-y-1 text-sm">
                      <span className="block font-medium text-gray-600 dark:text-gray-300">Character</span>
                      <select className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" disabled={!isEditMode} value={relationshipDraft.charId} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, charId: Number(event.target.value) })}>
                        <option value={0}>Select character</option>
                        {allCharacters.filter((char) => char.id !== editingCharacter.id).map((char) => (
                          <option key={char.id} value={char.id}>{char.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                    <span className="block font-medium text-gray-600 dark:text-gray-300">Relationship Type</span>
                    <input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" placeholder="relationship type" disabled={!isEditMode} value={relationshipDraft.type} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, type: event.target.value })} />
                    </label>
                    <button type="button" disabled={!isEditMode} className="rounded-lg w-fit sm:w-full sm:mt-5.5 bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={() => {
                      if (!relationshipDraft.charId) return;
                      setEditingCharacter({ ...editingCharacter, relationships: [...editingCharacter.relationships, relationshipDraft] });
                      setRelationshipDraft({ charId: 0, type: "ally" });
                    }}>Add</button>
                  </div>
                </div>

                <div className="space-y-2">
                  {editingCharacter.relationships.map((relationship, index) => {
                    const relatedName = allCharacters.find((char) => char.id === relationship.charId)?.name || `ID ${relationship.charId}`;
                    return (
                      <div key={`${relationship.charId}-${index}`} className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
                        <span>{relatedName} · <strong>{relationship.type}</strong></span>
                        <button type="button" disabled={!isEditMode} className="text-sm text-red-500 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => setEditingCharacter({ ...editingCharacter, relationships: editingCharacter.relationships.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "meta" && (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold">Tags checklist</p>
                  <div className="flex flex-wrap gap-2">
                    {tagOptions.map((option) => (
                      <button
                        type="button"
                        disabled={!isEditMode}
                        key={option}
                        onClick={() => toggleChecklist(option, editingCharacter.tags, (tags) => setEditingCharacter({ ...editingCharacter, tags }))}
                        className={`rounded-full border px-3 py-1 text-sm disabled:cursor-not-allowed ${editingCharacter.tags.includes(option) ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"}`}
                      >
                        {editingCharacter.tags.includes(option) ? "✓ " : ""}{option}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2" hidden={!isEditMode}>
                    <input className="w-full rounded-lg border p-2 dark:bg-gray-800 disabled:opacity-80" disabled={!isEditMode} value={customTagDraft} onChange={(event) => setCustomTagDraft(event.target.value)} placeholder="Add custom tag option" />
                    <button type="button" disabled={!isEditMode} className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={() => {
                      const cleaned = normalizeWhitespace(customTagDraft);
                      if (!cleaned) return;
                      setTagOptions((prev) => Array.from(new Set([...prev, cleaned])));
                      setCustomTagDraft("");
                    }}>Add</button>
                  </div>
                </div>

                <ChipEditor disabled={!isEditMode} label="Races" items={editingCharacter.setRace} onChange={(setRace) => setEditingCharacter({ ...editingCharacter, setRace })} placeholder="Add race" />
              </div>
            )}
          </div>
        </div>

        {/* BUILD SUMMARY CARD */}
        <div className="lg:sticky lg:top-15 h-fit space-y-2">

          {alert && 
            <p className="mb-1 text-center rounded-lg bg-red-100 px-2 py-1 text-base font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-200">{alert}</p>
          }

          {success && 
            <p className="mb-1 text-center rounded-lg bg-emerald-100 px-2 py-1 text-base font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">{success}</p>
          }

          {/* RELATIONSHIP SIDEBAR*/}
          {editingCharacter.relationships?.length >= 1 && !isEditMode && (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex justify-between">
                <div className="text-lg font-bold">
                  Related Characters
                </div>

                {editingCharacter.relationships?.length > 6 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRelatedCharactersPage((prev) => Math.max(prev - 1, 0))}
                      disabled={relatedCharactersPage === 0}
                      className="rounded-xl bg-gray-200 px-3 py-1.5 text-xs font-medium transition hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <FontAwesomeIcon icon={faArrowLeft}/>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRelatedCharactersPage((prev) =>
                          Math.min(prev + 1, Math.ceil(editingCharacter.relationships.length / relatedCharactersPerPage) - 1)
                        )
                      }
                      disabled={(relatedCharactersPage + 1) * relatedCharactersPerPage >= editingCharacter.relationships.length}
                      className="rounded-xl bg-gray-200 px-3 py-1.5 text-xs font-medium transition hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <FontAwesomeIcon icon={faArrowRight}/>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-3 notes-scroll">
                {editingCharacter.relationships
                  ?.slice(
                    relatedCharactersPage * relatedCharactersPerPage,
                    (relatedCharactersPage + 1) * relatedCharactersPerPage
                  )
                  .map((rel, i) => {
                    const relatedName = allCharacters.find((char) => char.id === rel.charId)?.name || `ID ${rel.charId}`;
                  return (
                    <div
                      key={`${rel.charId}-${i}`}
                      className="group relative grid place-items-center"
                    >
                      <div 
                        className="h-20 w-20 lg:w-18 lg:h-18 rounded-full overflow-hidden shadow-lg border-2 border-slate-700 group-hover:scale-105 group-hover:border-blue-600/70 transition-all duration-200 cursor-pointer"
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
                      <div className="absolute group-hover:bg-blue-200 dark:group-hover:bg-blue-600/70 group-hover:scale-105 justify-center -bottom-1 transition-all dark:text-white text-[10px] px-1 rounded-md whitespace-nowrap shadow-xl">
                        <span>
                          {upcaseLetter(relatedName || "Unknown").split(' ')[0]}
                        </span>
                      </div>  
                    </div>
                  );
                })}
              </div> 

            </div>
          )}

          <aside className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 ">
            <div className="flex justify-between">
              <h2 className="text-lg font-bold">Build Summary</h2>
              <button
                type="button"
                className={`
                  rounded-lg px-3 py-2 text-sm font-semibold 
                  ${isEditMode 
                    ? "border border-cyan-300 text-cyan-700 hover:bg-cyan-200 dark:border-cyan-700 dark:text-cyan-200 dark:hover:bg-cyan-900/20" 
                    : "border border-blue-300 text-blue-700 hover:bg-blue-200 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-900/20"}`}
                onClick={() => toogleEditMode()}
              > <FontAwesomeIcon icon={isEditMode ? faToggleOn : faToggleOff} />
                {!isEditMode ? " Browsing" : " Editing"}
              </button>
            </div>

            
            <p className="text-sm text-gray-500 dark:text-gray-300">Progression completion</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${completion}%` }} />
            </div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-200">{completion}% complete</p>

            {/* MISSING FIELDS CHECK CARD */}
            <div className="rounded-md border border-emerald-300 bg-emerald-50/80 p-3 dark:border-emerald-700 dark:bg-emerald-900/20">
              <p className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Missing fields check.
              </p>
              {missingFields.length === 0 ? (
                <p className="text-sm">Nice! Your character build has no blank priority fields.</p>
              ) : (
                <ul className="max-h-36 list-disc space-y-1 overflow-y-auto notes-scroll pl-4 text-sm">
                  {missingFields.slice(0, 8).map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              )}
              {missingFields.length > 8 && (
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                  +{missingFields.length - 8} more fields are still blank.
                </p>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <p><strong>Book:</strong> {book.title}</p>
              <p><strong>Tags:</strong> {editingCharacter.tags.length > 0 ? editingCharacter.tags.join(", ") : "None"}</p>
            </div>

            {isEditMode && (
            <div>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  className={`w-full rounded-lg px-3 py-2 text-sm font-semibold text-white ${isEditMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-400 disabled:opacity-50 cursor-not-allowed"}`}
                  disabled={!isEditMode}
                  onClick={() => void saveCharacter()}
                >
                  Save Build
                </button>

                <button
                  type="button"
                  className={`w-full rounded-lg px-3 py-2 text-sm font-semibold text-white ${isEditMode ? "bg-gray-800/50 hover:bg-gray-800" : "disabled:opacity-80 cursor-not-allowed"}`}
                  disabled={!isEditMode}
                  onClick={() => void navigate(`/book/${currentBookId}`)}
                >
                  Back to book
                </button>
                
                <span className="border-t-1 text-xs text-gray-500 mt-3 pb-3"></span>
              </div>

              <div className="flex">
                <button
                  type="button"
                  disabled={!isEditMode}
                  className="mt-2 rounded-lg bg-red-700/50 px-1.5 py-2 text-[12px] font-semibold text-white hover:bg-red-700/60 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void deleteCharacter(editingCharacter.id)}
                >
                  Delete Character
                </button>
              </div>
            </div>
            )}
            
          </aside>

        </div>

      </div>

      {showImagePicker && (
        <div 
          className="fixed h-dvh inset-0 flex items-center justify-center bg-black/50 z-50" 
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
            showImageModal(false);
            }
          }} 
          >
          <div 
            className="w-full mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Choose Character Display Image</h3>
              <button
                type="button"
                onClick={() => showImageModal(false)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm dark:border-gray-600"
              >
                Close
              </button>
            </div>

            <div className="mb-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Upload Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void onUploadImage(event)}
                />
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={imagePrompt}
                  onChange={(event) => setImagePrompt(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  placeholder="Generate portrait prompt (e.g. silver-haired mage, anime style)"
                />
                <button
                  type="button"
                  // disabled={isGeneratingImage}
                  disabled
                  onClick={() => void generateImageFromPrompt()}
                  className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  {isGeneratingImage ? "Generating..." : "Generate"}
                </button>
              </div>

              {imageActionError && (
                <p className="mt-2 text-xs text-red-500">{imageActionError}</p>
              )}
            </div>

            {characterImages.length === 0 ? (
              <p className="rounded-lg bg-gray-100 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                No saved images found for this character yet. Upload or generate an image first, then come back and choose one.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 max-h-90 overflow-y-auto notes-scroll">
                {characterImages.map((image) => (
                  <div key={image.imageId} className="group relative">
                    <button
                      type="button"
                      onClick={() => setPendingImageId(image.imageId)}
                      className={`w-full overflow-hidden rounded-lg border-2 transition ${
                        pendingImageId === image.imageId
                          ? "border-indigo-500 ring-2 ring-indigo-300"
                          : "border-transparent hover:border-indigo-300"
                      }`}
                    >
                      <img src={image.url} alt="Character option" className="h-28 w-full object-cover" />
                      <div className="bg-black/70 px-2 py-1 text-xs text-white">
                        {new Date(image.createdAt).toLocaleString()}
                      </div>
                    </button>

                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
              
              <button
                type="button"
                title="Delete image"
                disabled={!pendingImageId}
                onClick={() => {void deleteImage(pendingImageId);}}
                className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => showImageModal(false)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!pendingImageId || pendingImageId === selectedImageId}
                onClick={() => void confirmDisplayImage()}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Selection
              </button>
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
                fixed bottom-5 right-5 xxs:z-50 hidden xxs:block
                border border-gray-200 bg-gradient-to-br from-blue-600 to-cyan-500
                hover:border-gray-100 hover:from-blue-600/80 hover:to-cyan-400
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
                    shadow-2xl p-3 rounded-t-2xl
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

      {/* world atlas slide bar */}
      {isWorldAtlasMounted && (
        <div
          className={`fixed inset-0 z-50 transition-all duration-500 ease-out xxs:grid xxs:grid-cols-[1.1fr_0.9fr]
            ${isWorldAtlasVisible 
              ? "bg-slate-950/70 backdrop-blur-md opacity-100" 
              : "bg-slate-950/0 backdrop-blur-0 opacity-0"}
            `}  
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeWorldAtlas();
              setShowWorldbuildingModal(false);
            }
          }}
        >
          <div
            className={`relative h-full w-full max-w-full
            rounded-r-3xl border-r border-white/10
            bg-gradient-to-b from-[#020617] via-[#020617] to-[#0a1628]
            text-white shadow-[0_0_80px_rgba(34,211,238,0.08)]
            transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
            will-change-transform overflow-auto notes-scroll
            ${isWorldAtlasVisible 
              ? "translate-x-0 opacity-100 scale-100" 
              : "-translate-x-full opacity-0 scale-[0.98]"}
            `}
            onMouseDown={(e) => e.stopPropagation()}
          >

            <RotatingGlobe />

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
                <div className="flex sm:items-start justify-between gap-3">
                  <div className="">
                    <p className="hidden sm:block text-[11px] uppercase tracking-[0.45em] text-cyan-300/60">Archive of Worlds</p>
                    <h2 className="sm:mt-2 text-2xl font-semibold bg-gradient-to-r from-white via-cyan-100 to-slate-400 bg-clip-text text-transparent">
                      {book?.title || "Your Story"} — Atlas
                    </h2>
                    <p className="hidden sm:block mt-2 max-w-2xl text-sm text-slate-300">
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
                    onClick={() => selectWorldSectionForEdit(activeWorldSectionId!)}
                    disabled={worldbuildingSections.length < 1}
                    title="Edit selected section"
                  >
                    <FontAwesomeIcon icon={faPen} /> Edit section
                  </button>
                </div>
              </div>

              {worldbuildingSections.length > 0 ? (
                <div className="grid min-h-0 flex-1 xxs:grid-cols-[0.6fr_1.4fr]">
                  <div className="overflow-y-auto border-b border-white/10 lg:border-b-0 lg:border-r notes-scroll">
                    <p className="p-2 text-xs uppercase tracking-[0.3em] text-slate-400">Lore paths</p>
                    <div className="">
                      {worldbuildingSections.map((section) => (
                        <button
                          key={`atlas-section-${section.id}`}
                          type="button"
                          onClick={() => {
                            setActiveWorldSectionId(section.id); 
                            if (showEditWorldbuildingModal) { 
                              if(!section.id) return;
                              selectWorldSectionForEdit(section.id);
                            };
                          }}
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

          {/* WORLD BUILDING INPUT MODAL */}
          {showWorldbuildingModal && (
            <div
              className="flex items-center w-full
              
              fixed inset-0 z-60 justify-center bg-slate-950/70 backdrop-blur-md
              
              xxs:static xxs:justify-start xxs:inset-auto xxs:z-0 xxs:bg-transparent backdrop-blur-none
              " 
            >
              <div className="w-full max-w-lg h-screen overflow-y-auto rounded-3xl xxs:rounded-l-xs border border-cyan-400/20 bg-gradient-to-b from-[#020617] via-[#020617] to-[#0a1628] p-5 text-white shadow-[0_0_80px_rgba(34,211,238,0.12)] notes-scroll" onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h2 className="mt-1 text-lg font-semibold bg-gradient-to-r from-white via-cyan-100 to-slate-400 bg-clip-text text-transparent">Add Worldbuilding Section</h2>
                    <p className="text-xs text-slate-300 mt-1">Add a title, then as many label/value facts as you need.</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200 transition hover:bg-white/10"
                    onClick={() => {setShowWorldbuildingModal(false); document.body.classList.toggle('overflow-hidden', false);}}
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={saveWorldbuildingSection} className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Section Title</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-2xl border border-cyan-400/30 bg-white/[0.03] px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                      placeholder="ex: Economy, Politics, Religion..."
                      value={worldSectionTitle}
                      onChange={(e) => setWorldSectionTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Entries (Label + Value)</label>
                      <button
                        type="button"
                        className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                        onClick={addWorldDraftEntry}
                      >
                        <FontAwesomeIcon icon={faPlus} /> Add entry
                      </button>
                    </div>

                    {worldDraftEntries.map((entry, index) => (
                      <div key={`draft-entry-${index}`} className="rounded-2xl border border-white/15 bg-white/[0.03] p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Entry #{index + 1}</span>
                          <button
                            type="button"
                            className="text-xs text-rose-300 transition hover:text-rose-200 disabled:opacity-40"
                            onClick={() => removeWorldDraftEntry(index)}
                            disabled={worldDraftEntries.length === 1}
                          >
                            Remove
                          </button>
                        </div>

                        <input
                          type="text"
                          className="w-full rounded-xl border border-cyan-400/25 bg-white/[0.03] px-2 py-1 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/70 focus:outline-none"
                          placeholder="Label (ex: Cost, Rule, Limitation)"
                          value={entry.label}
                          onChange={(e) => updateWorldDraftEntry(index, "label", e.target.value)}
                        />
                        <textarea
                          rows={2}
                          className="w-full rounded-xl border border-cyan-400/25 bg-white/[0.03] px-2 py-1 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/70 focus:outline-none"
                          placeholder="Value / detail"
                          value={entry.value}
                          onChange={(e) => updateWorldDraftEntry(index, "value", e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.3)]"
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
              className="flex items-center w-full
              
              fixed inset-0 z-60 justify-center bg-slate-950/70 backdrop-blur-md
              
              xxs:static xxs:justify-start xxs:inset-auto xxs:z-0 xxs:bg-transparent backdrop-blur-none"
            >
              {/* title */}
              <div className="w-full h-screen xxs:max-w-xl overflow-y-auto rounded-3xl xxs:rounded-l-xs border border-cyan-400/20 bg-gradient-to-b from-[#020617] via-[#020617] to-[#0a1628] p-5 text-white shadow-[0_0_80px_rgba(34,211,238,0.12)] notes-scroll">

                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  {selectedWorldSectionId && (
                    <div>
                      <h2 className="mt-1 text-lg font-semibold bg-gradient-to-r from-white via-cyan-100 to-slate-400 bg-clip-text text-transparent">Edit World Setting Section</h2>
                      <p className="text-xs text-slate-300 mt-1">Choose one section, then update its title and entries.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-200 transition hover:bg-white/10"
                    onClick={closeEditWorldbuildingModal}
                  >
                    Close
                  </button>
                </div>
              

                {/* world sections list */}
                <div className="mt-2 space-y-3">
                  {/* chosen section edit */}
                  {selectedWorldSectionId && (
                    <form onSubmit={saveEditedWorldbuildingSection} className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Section Title</label>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-2xl border border-cyan-400/30 bg-white/[0.03] px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                          placeholder="ex: Economy, Politics, Religion..."
                          value={editWorldSectionTitle}
                          onChange={(e) => setEditWorldSectionTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Entries (Label + Value)</label>
                          <button
                            type="button"
                            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                            onClick={addEditWorldDraftEntry}
                          >
                            <FontAwesomeIcon icon={faPlus} /> Add entry
                          </button>
                        </div>

                        {editWorldDraftEntries.map((entry, index) => (
                          <div key={`edit-draft-entry-${index}`} className="rounded-2xl border border-white/15 bg-white/[0.03] p-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">Entry #{index + 1}</span>
                              <button
                                type="button"
                                className="text-xs text-rose-300 transition hover:text-rose-200 disabled:opacity-40"
                                onClick={() => removeEditWorldDraftEntry(index)}
                                disabled={editWorldDraftEntries.length === 1}
                              >
                                Remove
                              </button>
                            </div>

                            <input
                              type="text"
                              className="w-full rounded-xl border border-cyan-400/25 bg-white/[0.03] px-2 py-1 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/70 focus:outline-none"
                              placeholder="Label (ex: Cost, Rule, Limitation)"
                              value={entry.label}
                              onChange={(e) => updateEditWorldDraftEntry(index, "label", e.target.value)}
                            />
                            <textarea
                              rows={2}
                              className="w-full rounded-xl border border-cyan-400/25 bg-white/[0.03] px-2 py-1 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/70 focus:outline-none"
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
                          className="rounded-full border border-rose-300/40 bg-rose-500/10 px-4 py-1.5 text-sm text-rose-200 transition hover:bg-rose-500/20"
                          onClick={() => deleteWorldbuildingSection(selectedWorldSectionId)}
                        >
                          Delete Section
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.3)]"
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

        </div>
      )}

      {/* CHANGES SAVED POPUP */}
      {showStatePopup && (
      <div className="fixed z-100 top-14 left-1/2 bg-gray-800 py-1 px-5 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
          <span>
          {alert}
          <FontAwesomeIcon className="text-green-500" size="lg" icon={faCheck}/>
          </span>
      </div>
      )}

      {/* Undo Popup */}
      {showUndoPopup && (
          <div className="fixed z-100 top-14 left-1/2 bg-gray-800 py-4 px-8 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
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
    </div>
  );
}
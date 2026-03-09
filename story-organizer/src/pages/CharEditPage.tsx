import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, type Book, type Character, type CharacterDescription, type CharImage } from "../db";

type EditTab = "profile" | "lore" | "abilities" | "appearance" | "relationships" | "meta";

type ChipEditorProps = {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
};

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

function ChipEditor({ label, items, onChange, placeholder }: ChipEditorProps) {
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
        {items.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => removeItem(item)}
            className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700 transition hover:bg-red-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-red-900/60"
          >
            {item} ×
          </button>
        ))}
      </div>

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
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function CharEditPage() {
  const { currentBookId, characterSlug } = useParams();
  const navigate = useNavigate();
  const selectedCharacterId = Number(characterSlug?.split("-")[0]);

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
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [characterImages, setCharacterImages] = useState<CharImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState("");
  const [charImage] = useState("/textures/char_images/default_char.jpg");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageActionError, setImageActionError] = useState(""); 
  const [pendingImageId, setPendingImageId] = useState("");

  const isEditPage = location.pathname.endsWith("/edit");

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
      setTagOptions(Array.from(new Set([...TAG_OPTIONS, ...loadedCharacter.tags])));
    };

    void loadData();
  }, [currentBookId, selectedCharacterId]);

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

  useEffect(() => {
    void loadCharacterImages();
  }, [selectedCharacterId]);

  useEffect(() => {
    return () => {
      characterImages.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, [isEditPage]);

  const selectedCharacterImage =
    characterImages.find((image) => image.imageId === selectedImageId)?.url || charImage;

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
      { label: "Titles", value: editingCharacter.titles.length },
      { label: "Traits", value: editingCharacter.personalityTraits.length },
      { label: "Tags", value: editingCharacter.tags.length },
      { label: "Abilities", value: editingCharacter.abilities.length },
      { label: "Relationships", value: editingCharacter.relationships.length },
      { label: "Appearance • Age", value: editingCharacter.description.basic.age },
      { label: "Appearance • Race", value: editingCharacter.description.basic.race },
      { label: "Appearance • Gender", value: editingCharacter.description.basic.gender },
      { label: "Appearance • Eye Color", value: editingCharacter.description.face.eyeColor },
      { label: "Appearance • Hair Color", value: editingCharacter.description.hair.hairColor },
      { label: "Appearance • Body Type", value: editingCharacter.description.body.bodyType },
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
    setSuccess("Character progression saved!");
    setTimeout(() => setSuccess(""), 1800);
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

  return (
    // MAIN EDIT PAGE CONTAINER
    <div className="mx-auto w-full max-w-7xl p-4 md:p-6 mt-10">

      {/* HERO CARD HEADER OF EDIT PAGE */}
      <div className="rounded-2xl border border-indigo-300/30 bg-gradient-to-br from-gray-700 to-slate-900 px-5 py-2 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              title="Change character image"
              onClick={() => showImageModal(true)}
              className="group relative h-24 w-20 overflow-hidden rounded-xl border border-slate-700 shadow-lg"
            >
              <img
                src={selectedCharacterImage}
                alt={editingCharacter.name}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100">
                <span className="rounded-lg bg-white/20 px-2 py-1 text-2xl font-bold">+</span>
              </div>
            </button>

            <div>
              <p className="text-sm text-indigo-200">Character Builder</p>
              <h1 className="text-3xl font-bold">{editingCharacter.name || "Unnamed Character"}</h1>
              <p className="text-sm text-indigo-100">{editingCharacter.role || "Role not set"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <div className="rounded-xl bg-white/10 px-3 py-2">Status: {editingCharacter.status || "unknown"}</div>
            <div className="rounded-xl bg-white/10 px-3 py-2">Importance: {editingCharacter.importance || "unknown"}</div>
            <div className="rounded-xl bg-white/10 px-3 py-2">Power: {editingCharacter.powerLevel || "n/a"}</div>
          </div>
        </div>
      </div>

      {/* TABS EDITABLE CONTENT */}
      <div className="mt-3 grid gap-4 lg:grid-cols-[1.65fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            {activeTab === "profile" && (
              <div className="grid gap-3 md:grid-cols-2">
                <input className="rounded-lg border p-2 dark:bg-gray-800" placeholder="Name" value={editingCharacter.name} onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })} />
                <input className="rounded-lg border p-2 dark:bg-gray-800" placeholder="Role" value={editingCharacter.role} onChange={(e) => setEditingCharacter({ ...editingCharacter, role: e.target.value })} />
                <input className="rounded-lg border p-2 dark:bg-gray-800" placeholder="Status" value={editingCharacter.status} onChange={(e) => setEditingCharacter({ ...editingCharacter, status: e.target.value })} />
                <input className="rounded-lg border p-2 dark:bg-gray-800" placeholder="Importance" value={editingCharacter.importance} onChange={(e) => setEditingCharacter({ ...editingCharacter, importance: e.target.value })} />
                <input className="rounded-lg border p-2 dark:bg-gray-800" placeholder="Occupation" value={editingCharacter.occupation} onChange={(e) => setEditingCharacter({ ...editingCharacter, occupation: e.target.value })} />
                <input className="rounded-lg border p-2 dark:bg-gray-800" placeholder="Power Level" value={editingCharacter.powerLevel} onChange={(e) => setEditingCharacter({ ...editingCharacter, powerLevel: e.target.value })} />
                <input className="rounded-lg border p-2 dark:bg-gray-800" placeholder="Net Worth" value={editingCharacter.netWorth} onChange={(e) => setEditingCharacter({ ...editingCharacter, netWorth: e.target.value })} />
                <input className="rounded-lg border p-2 dark:bg-gray-800" placeholder="First chapter appearance" value={editingCharacter.chapters} onChange={(e) => setEditingCharacter({ ...editingCharacter, chapters: e.target.value })} />

                <div className="md:col-span-2">
                  <ChipEditor label="Titles" items={editingCharacter.titles} onChange={(titles) => setEditingCharacter({ ...editingCharacter, titles })} placeholder="Add title" />
                </div>
                <div className="md:col-span-2">
                  <ChipEditor label="Personality traits" items={editingCharacter.personalityTraits} onChange={(personalityTraits) => setEditingCharacter({ ...editingCharacter, personalityTraits })} placeholder="Add trait" />
                </div>
                <div className="md:col-span-2">
                  <ChipEditor label="Chapter appearances" items={editingCharacter.chapterAppearances} onChange={(chapterAppearances) => setEditingCharacter({ ...editingCharacter, chapterAppearances })} placeholder="e.g. Ch. 8" />
                </div>
              </div>
            )}

            {activeTab === "lore" && (
              <div className="space-y-3">
                <textarea rows={6} className="w-full rounded-lg border p-2 dark:bg-gray-800" placeholder="Backstory notes" value={editingCharacter.notes} onChange={(e) => setEditingCharacter({ ...editingCharacter, notes: e.target.value })} />
                <textarea rows={4} className="w-full rounded-lg border p-2 dark:bg-gray-800" placeholder="Future notes" value={editingCharacter.futureNotes} onChange={(e) => setEditingCharacter({ ...editingCharacter, futureNotes: e.target.value })} />
                <textarea rows={5} className="w-full rounded-lg border p-2 dark:bg-gray-800" placeholder="Character arc" value={editingCharacter.characterArc} onChange={(e) => setEditingCharacter({ ...editingCharacter, characterArc: e.target.value })} />
              </div>
            )}

            {activeTab === "abilities" && (
              <div className="space-y-3">
                {editingCharacter.abilities.map((ability, index) => (
                  <div key={`${ability.ability}-${index}`} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input className="w-1/3 rounded-lg border p-2 dark:bg-gray-800" value={ability.ability} placeholder="Ability" onChange={(event) => {
                        const next = [...editingCharacter.abilities];
                        next[index] = { ...next[index], ability: event.target.value };
                        setEditingCharacter({ ...editingCharacter, abilities: next });
                      }} />
                      <textarea className="w-full rounded-lg border p-2 dark:bg-gray-800" rows={2} value={ability.description} placeholder="Ability description" onChange={(event) => {
                        const next = [...editingCharacter.abilities];
                        next[index] = { ...next[index], description: event.target.value };
                        setEditingCharacter({ ...editingCharacter, abilities: next });
                      }} />
                      <button type="button" className="rounded-lg bg-red-500 px-3 py-2 text-white" onClick={() => setEditingCharacter({ ...editingCharacter, abilities: editingCharacter.abilities.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
                    </div>
                  </div>
                ))}

                <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => setEditingCharacter({ ...editingCharacter, abilities: [...editingCharacter.abilities, { ability: "", description: "" }] })}>+ Add Ability</button>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                {Object.entries(editingCharacter.description).map(([section, values]) => (
                  <div key={section} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">{section}</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      {Object.entries(values).map(([key, value]) => (
                        <input
                          key={key}
                          className="rounded-lg border p-2 dark:bg-gray-800"
                          placeholder={key}
                          value={value}
                          onChange={(event) => updateDescription(section as keyof CharacterDescription, key, event.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "relationships" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <select className="rounded-lg border p-2 dark:bg-gray-800" value={relationshipDraft.charId} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, charId: Number(event.target.value) })}>
                      <option value={0}>Select character</option>
                      {allCharacters.filter((char) => char.id !== editingCharacter.id).map((char) => (
                        <option key={char.id} value={char.id}>{char.name}</option>
                      ))}
                    </select>
                    <input className="rounded-lg border p-2 dark:bg-gray-800" placeholder="relationship type" value={relationshipDraft.type} onChange={(event) => setRelationshipDraft({ ...relationshipDraft, type: event.target.value })} />
                    <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => {
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
                        <button type="button" className="text-sm text-red-500" onClick={() => setEditingCharacter({ ...editingCharacter, relationships: editingCharacter.relationships.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
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
                        key={option}
                        onClick={() => toggleChecklist(option, editingCharacter.tags, (tags) => setEditingCharacter({ ...editingCharacter, tags }))}
                        className={`rounded-full border px-3 py-1 text-sm ${editingCharacter.tags.includes(option) ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"}`}
                      >
                        {editingCharacter.tags.includes(option) ? "✓ " : ""}{option}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input className="w-full rounded-lg border p-2 dark:bg-gray-800" value={customTagDraft} onChange={(event) => setCustomTagDraft(event.target.value)} placeholder="Add custom tag option" />
                    <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => {
                      const cleaned = normalizeWhitespace(customTagDraft);
                      if (!cleaned) return;
                      setTagOptions((prev) => Array.from(new Set([...prev, cleaned])));
                      setCustomTagDraft("");
                    }}>Add</button>
                  </div>
                </div>

                <ChipEditor label="Races" items={editingCharacter.setRace} onChange={(setRace) => setEditingCharacter({ ...editingCharacter, setRace })} placeholder="Add race" />
              </div>
            )}
          </div>
        </div>

        {/* BUILD SUMMARY CARD */}
        <div className="lg:sticky lg:top-15 h-fit">

          {alert && 
            <p className="mb-1 text-center rounded-lg bg-red-100 px-2 py-1 text-base font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-200">{alert}</p>
          }

          {success && 
            <p className="mb-1 text-center rounded-lg bg-emerald-100 px-2 py-1 text-base font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">{success}</p>
          }

          <aside className=" space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 ">
            <h2 className="text-lg font-bold">Build Summary</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">Progression completion</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${completion}%` }} />
            </div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">{completion}% complete</p>

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

            <div className="flex flex-col gap-2 pt-1">
              <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700" onClick={() => void saveCharacter()}>Save Build</button>
              <button type="button" className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600" onClick={() => navigate(`/book/${currentBookId}/${editingCharacter.id}-${editingCharacter.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)}>Back to Character</button>
            </div>
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
                  disabled={isGeneratingImage}
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

    </div>
  );
}
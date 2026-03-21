import Dexie, { type Table } from "dexie";

export type Character = {
  id: number;
  bookId: string;

  name: string;
  role: string; // protagonist, antagonist, supporting, confidant, mentor, love interest, background character, etc...

  status: string; // "alive" | "dead" | "undead" |"unknown"
  importance: string; //"primary" | "secondary" | "tertiary" | "unknown"
  occupation: string;
  setRace: string[]; // adds other multiple races that the character may have/will have in the progression of the story

  notes: string; // this is the background of the character
  futureNotes: string; // Future progression/future plans for the character...

  characterArc: string; // character development
  netWorth: string; // character worth in assets, money, etc...

  titles: string[]; // characters can have many titles, separated by comma
  powerLevel: string; // depends on the author's story

  personalityTraits: string[]; // "cold", "calculating", "loyal", "sarcastic", etc...
  tags: string[]; // "mage", "royalty", "antagonist", "betrayer", etc... 

  chapterAppearances: string[]; // I want to add it to search filter, when searching for chapters, then characters that appeared in certain chapters will show
  chapters: string; // first chapter appearance of the character
  
  abilities: {
    ability: string; 
    description: string;
  }[]; // abilities/skills and description

  relationships: {
    charId: number; // save character id to easily filter
    type: string; // family, friend, bestfriend, mentor, archnemesis, rival, love interest, lover, wife, husband, etc...
  }[];

  priority: number;
  description: CharacterDescription;

  createdAt: number;
  updatedAt: number;
};

export type CharacterDescription = {
  basic: {
    age: string;
    race: string; // current race of the character
    gender: string;
  };

  face: {
    faceShape: string;
    eyeColor: string;
    eyeShape: string;
    noseShape: string;
    mouthSize: string;
  };

  hair: {
    hairColor: string;
    hairStyle: string;
  };

  body: {
    bodyType: string;
    height: string;
    skinTone: string;
  };

  extras: {
    distinguishingFeatures: string;
    accessories: string;
    clothingStyle: string;
  };
};

export type Book = {
  id: string; // make optional for auto-increment
  title: string;
  summary: string;
  volume: number;
  volumeName: string;
  createdAt: number;
  tags: string[];
  genre: string[];
  chapterCount: number;
  status: string; // completed | ongoing | hiatus | dropped
};

export type WorldbuildingEntry = {
  label: string;
  value: string;
};

export type WorldbuildingSection = {
  id: string;
  bookId: string;
  title: string;
  entries: WorldbuildingEntry[];
};

export type Images = {
  imageId: string; // created string crypto.UUID
  charId: number; // character ids for matching characters
  bookId: string; // assign bookId for matching book covers
  createdAt: number;
  imageBlob: Blob; // convert and store the image file into an imageBlob
  isDisplayed: boolean; // state if the image is selected to be displayed as char image
}

export type CharImage = {
  url: string;
  imageId: string;
  isDisplayed: boolean;
  createdAt: number;
}

export type EditableCharacter = Character & {
  abilitiesText: string;
};

export type Notes = {
  notesId: string;
  createdAt: number;
  id?: number;
  subject: string;
  content: string;
  color: string;
  bookId: string;
  charId: number | null;
  pinned?: boolean;
}

class StoryDB extends Dexie {
  books!: Table<Book>;
  images!: Table<Images>;
  notes!: Table<Notes>;
  characters!: Table<Character>;
  worldSetting!: Table<WorldbuildingSection>;

  constructor() {
    super("StoryDB");

    this.version(22).stores({
      books: "id, title", 
      images: "imageId, charId, bookId",
      notes: "++id, bookId, charId, pinned",
      characters: "id, bookId, name, priority,*chapterAppearances, status, *setRace",
      worldSetting: "id, bookId, title",
      // ++id = auto increment
      // title = indexed (useful later for search)
    })
      .upgrade(async (tx) => {
          await tx.table("characters").toCollection().modify(character => {
          if (typeof character.priority !== "number" || Number.isNaN(character.priority)) {
            character.priority = 0;
          }
        });
      });

    // .upgrade(async (tx) => {
    //   // 1. Get the notes table as a collection
    //   // 2. Use .modify() with a callback to update each record
    //   return tx.table("notes").toCollection().modify(note => {
    //     // Set default value only if it doesn't already exist
    //     if (note.pinned === undefined) {
    //       note.pinned = false;
    //     }
    //   });
    // });

  }
}

export const db = new StoryDB();
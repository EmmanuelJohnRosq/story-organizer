import Dexie, { type Table } from "dexie";

export type Character = {
  id: number;
  name: string;
  role: string;
  notes: string;
  abilities: string[];
  arcStage: string;
  relationships: { name: string; type: string }[];
};

export type Book = {
  id: string; // make optional for auto-increment
  title: string;
  characters: Character[];
};

export type Images = {
    imageId: string;
    imageBlob: Blob;
}

export type EditableCharacter = Character & {
  abilitiesText: string;
};

class StoryDB extends Dexie {
  books!: Table<Book>;

  constructor() {
    super("StoryDB");

    this.version(2).stores({
      books: "id, title", 
      images: "imageId, imageBlob",
      // ++id = auto increment
      // title = indexed (useful later for search)
    });
  }
}

export const db = new StoryDB();
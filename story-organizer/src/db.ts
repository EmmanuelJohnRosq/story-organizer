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
  createdAt: number;
};

export type Images = {
    imageId: string; //
    charId: number;
    createdAt: number;
    imageBlob: Blob;
}

export type EditableCharacter = Character & {
  abilitiesText: string;
};

class StoryDB extends Dexie {
  books!: Table<Book>;
  images!: Table<Images>;

  constructor() {
    super("StoryDB");

    this.version(4).stores({
      books: "id, title", 
      images: "imageId, charId, imageBlob",
      // ++id = auto increment
      // title = indexed (useful later for search)
    });
  }
}

export const db = new StoryDB();
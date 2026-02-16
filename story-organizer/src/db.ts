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
  summary: string;
  volume: number;
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

export type Notes = {
  notesId: string;
  createdAt: number;
  id?: number;
  subject: string;
  content: string;
}

class StoryDB extends Dexie {
  books!: Table<Book>;
  images!: Table<Images>;
  notes!: Table<Notes>;

  constructor() {
    super("StoryDB");

    this.version(5).stores({
      books: "id, title", 
      images: "imageId, charId, imageBlob",
      notes: "++id, subject",
      // ++id = auto increment
      // title = indexed (useful later for search)
    });
  }
}

export const db = new StoryDB();
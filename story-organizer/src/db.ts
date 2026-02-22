import Dexie, { type Table } from "dexie";

export type Character = {
  id: number;
  bookId: string;
  name: string;
  role: string;
  notes: string;
  abilities: string[];
  chapters: string;
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
  color: string;
  bookId: string;
  charId: number | null;
}

class StoryDB extends Dexie {
  books!: Table<Book>;
  images!: Table<Images>;
  notes!: Table<Notes>;

  constructor() {
    super("StoryDB");

    this.version(8).stores({
      books: "id, title", 
      images: "imageId, charId, imageBlob",
      notes: "++id, bookId, charId",
      characters: "id, bookId, name, relationships, chapters"
      // ++id = auto increment
      // title = indexed (useful later for search)
    })
    
    .upgrade(async (tx) => {

    await tx.table("books").toCollection().modify((book: any) => {

      if (!Array.isArray(book.characters)) return;

      book.characters.forEach((char: any) => {

        // Add chapters only if missing
        if (char.chapters === undefined) {
          char.chapters = char.arcStage ?? "";
        }

        // Add bookId only if missing
        if (!char.bookId) {
          char.bookId = book.id;
        }

        // Ensure defaults but DO NOT delete old fields
        if (!char.relationships) {
          char.relationships = [];
        }

        if (!char.abilities) {
          char.abilities = [];
        }

      });

    });

    });

  }
}

export const db = new StoryDB();
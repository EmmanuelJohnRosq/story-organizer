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
  // description: { race: string, age: string, }[];
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
  characters!: Table<Character>;

  constructor() {
    super("StoryDB");

    this.version(9).stores({
      books: "id, title", 
      images: "imageId, charId, imageBlob",
      notes: "++id, bookId, charId",
      characters: "id, bookId, name, relationships, chapters"
      // ++id = auto increment
      // title = indexed (useful later for search)
    })
    
    .upgrade(async (tx) => {

      const books = await tx.table("books").toArray();

      for (const book of books) {
        if (book.characters && book.characters.length > 0) {
          
          for (const character of book.characters) {
            await tx.table("characters").add({
              ...character,
              bookId: book.id
            });
          }

          // OPTIONAL: clear characters from book after migration
          await tx.table("books").update(book.id, {
            characters: []
          });
        }
      }
    });

  }
}

export const db = new StoryDB();
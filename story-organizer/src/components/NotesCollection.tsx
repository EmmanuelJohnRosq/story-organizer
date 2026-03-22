import { useEffect, useRef, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faStar } from "@fortawesome/free-solid-svg-icons";
import type { Notes } from "../db";

export type EditableNote = Notes & { isDraft?: boolean };

const colorMap: Record<string, string> = {
  yellow: "bg-yellow-200 dark:bg-yellow-800",
  pink: "bg-pink-200 dark:bg-pink-800",
  green: "bg-green-200 dark:bg-green-800",
  sky: "bg-sky-200 dark:bg-sky-800",
  purple: "bg-purple-200 dark:bg-purple-800",
  gray: "bg-gray-200 dark:bg-gray-900",
};

type NotesCollectionProps = {
  title?: string;
  notes: Notes[];
  draftNote: EditableNote | null;
  draftNoteState: boolean;
  noteToDelete: Notes | null;
  hideSave: boolean;
  onFocusId: string;
  noteContent?: string;
  emptyMessage: string;
  addLabel?: string;
  closeLabel?: string;
  className?: string;
  contentClassName?: string;
  textareaFocusRingClassName?: string;
  showPinnedIcon?: boolean;
  disableDeleteWhenPinned?: boolean;
  onAddDraft: () => void;
  onCloseDraft?: () => void;
  onChangeDraft: (content: string) => void;
  onChangeNote: (noteId: number, content: string) => void;
  onSaveNote: (note: EditableNote) => void;
  onDeleteRequest: (note: Notes) => void;
  onDeleteConfirm: (note: Notes) => void;
  onDeleteCancel: () => void;
  onFocusNote: (note: EditableNote) => void;
  onCancelEditing: () => void;
  onTogglePin?: (note: Notes) => void;
};

export default function NotesCollection({
  title,
  notes,
  draftNote,
  draftNoteState,
  noteToDelete,
  hideSave,
  onFocusId,
  noteContent,
  emptyMessage,
  addLabel = "Add",
  closeLabel = "Close",
  className,
  contentClassName,
  textareaFocusRingClassName = "focus:ring-1 focus:ring-gray-400 hover:ring-1 hover:ring-gray-400",
  showPinnedIcon = false,
  disableDeleteWhenPinned = false,
  onAddDraft,
  onCloseDraft,
  onChangeDraft,
  onChangeNote,
  onSaveNote,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onFocusNote,
  onCancelEditing,
  onTogglePin,
}: NotesCollectionProps) {
  const draftTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!draftNote || !draftTextareaRef.current) return;

    draftTextareaRef.current.focus({ preventScroll: true });
    draftTextareaRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [draftNote]);

  const renderedNotes = [...(draftNote ? [draftNote] : []), ...notes];

  const autoResize = (event: FormEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  return (
    <div className={className}>
      {title && (
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-gray-100 px-1 pb-2 dark:border-gray-800">
          <h3 className="text-sm font-semibold">{title}</h3>

            <div className="flex gap-2">
                <button
                    type="button"
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                    onClick={onAddDraft}
                >
                    {addLabel}
                </button>

                <button
                    type="button"
                    className="rounded-md bg-gray-400 px-3 py-1 text-xs text-white hover:bg-gray-500"
                    onClick={onCloseDraft}
                >
                    {closeLabel}
                </button>
            </div>
        </div>
      )}

      <div className={contentClassName ?? "mt-2 max-h-[calc(75vh-3.5rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain"}>
        {notes.length < 1 && !draftNote && (
          <div className="rounded-xl border-2 border-dashed border-gray-100 py-8 text-center dark:border-gray-500">
            <p className="text-xs italic text-gray-300">{emptyMessage}</p>
          </div>
        )}

        <div>
          {renderedNotes.map((note) => (
            <div
              className={`${colorMap[note.color] ?? colorMap.gray} relative mb-2 cursor-pointer rounded-md bg-gray-100 p-1 shadow-md dark:bg-gray-900 animate-fadeDown`}
              key={note.id ?? note.notesId}
              data-id={note.id}
            >
              <div className="flex justify-between pb-1">
                <div className="flex items-center gap-1">
                  {showPinnedIcon && note.id && (
                    <button
                      type="button"
                      className="transition-transform hover:scale-110"
                      onMouseDown={() => onTogglePin?.(note)}
                    >
                      <FontAwesomeIcon
                        icon={faStar}
                        className={note.pinned ? "text-yellow-400" : "text-gray-500 hover:text-yellow-500"}
                      />
                    </button>
                  )}

                  <span className="text-xs text-gray-800 dark:text-gray-400">
                    {new Date(note.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <button
                  type="button"
                  className="group rounded-full px-0.5"
                  onMouseDown={() => onDeleteRequest(note)}
                  disabled={!note.id || (disableDeleteWhenPinned && note.pinned === true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-700 group-hover:text-red-500 dark:text-gray-400"
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
                ref={!note.id ? draftTextareaRef : null}
                rows={3}
                value={note.content}
                placeholder="Enter Notes"
                onInput={autoResize}
                onFocus={(event) => {
                  autoResize(event);
                  onFocusNote(note);
                }}
                onChange={(event) => {
                  if (!note.id) {
                    onChangeDraft(event.target.value);
                    return;
                  }

                  onChangeNote(note.id, event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    (event.target as HTMLElement).blur();
                    onSaveNote(note);
                  }
                }}
                onBlur={(event) => {
                  event.currentTarget.style.height = "auto";
                }}
                className={`w-full resize-none overflow-hidden rounded-md px-1 text-sm transition-all duration-200 focus:outline-none ${textareaFocusRingClassName}`}
              />

              {hideSave && (note.id ? Number(onFocusId) === note.id : draftNoteState) && (
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    className="flex rounded-xl bg-neutral-500 px-4 py-1 hover:bg-neutral-600"
                    onMouseDown={onCancelEditing}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="flex rounded-xl bg-blue-700 px-4 py-1 hover:bg-blue-800 disabled:opacity-60"
                    onMouseDown={() => onSaveNote(note)}
                    disabled={noteContent !== undefined ? noteContent === note.content : false}
                  >
                    Save
                  </button>
                </div>
              )}

              {noteToDelete && noteToDelete.id === note.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/40 backdrop-blur-sm">
                  <div className="w-40 rounded-md bg-white p-3 text-center shadow-lg dark:bg-gray-800">
                    <p className="mb-2 text-sm">Delete this note?</p>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => onDeleteConfirm(noteToDelete)}
                        className="text-sm text-red-500 hover:scale-105"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={onDeleteCancel}
                        className="text-sm text-gray-500"
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
    </div>
  );
}
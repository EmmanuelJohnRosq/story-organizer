// import { useState, useEffect  } from 'react'
// // import reactLogo from './assets/react.svg'
// // import viteLogo from '/vite.svg'
// import './App.css'

// type Character = {
//   id: number;
//   name: string;
//   role: string;
//   race: string;
//   age: string;
//   powerLevel: string;
//   notes: string;
// };

// export default function StoryOrganizer() {

//   return (
//     <div> HANDLE ERROR</div>
//     <div className="PARENT MAIN ROOT Component">
  
//         {/* Title/Menu/HEADER */}
//         <header 
//           className={`
//           fixed top-0 left-0 w-full z-50
//           bg-gray-950 backdrop-blur-md
//           transition-transform duration-300 ease-in-out
//         `}>
//           <div className="flex justify-between place-items-center py-2 px-1 md:py-2 md:px-5 w-full sm:w-full mx-auto">
//             <h1 
//               className="text-white cursor-pointer hidden md:flex md:text-2xl sm:text-lg" 
//               onClick={() => {setCurrentBookId(null); setSelectedCharacter(null); }}
//               >📖STORY ORGANIZER
//             </h1>
  
//             <p className="md:hidden flex items-center justify-center text-2xl">📖</p>
  
//             <div className="flex gap-2">
              
//               {/* SEARCH INPUT FIELD... IN PROGRESS */}
//               <div className="hidden md:flex text-white bg-gray-950">   
//                   <label className="block text-sm font-medium text-heading sr-only ">Search</label>
//                   <div className="relative">
//                       <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
//                           <svg 
//                             className="w-4 h-4 text-gray-200"
//                             fill="none" 
//                             viewBox="0 0 24 24"
//                             strokeWidth={2}
//                             stroke="currentColor">
//                               <path 
//                               stroke="currentColor" 
//                               d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
//                               />
//                           </svg>
//                       </div>
//                       <input 
//                       className="w-full px-0 mt-1 py-1 ps-9 border-b 
//                         outline-none text-heading text-sm shadow-xs 
//                         focus:border-gray-200
//                         placeholder:text-body" 
//                         placeholder="Search" 
//                         title="Currently in development..." />
//                   </div>
//               </div>
  
//               {/* MOBILE ICON BUTTON */}
//               <button
//                 onClick={() => setOpenSearch(true)}
//                 className="
//                   md:hidden
//                   flex items-center justify-center
//                   w-10 h-9 group
//                   border rounded-md
//                   text-white bg-gray-950 
//                   hover:bg-gray-200
//                   transition
//                 "
//               >
//                 <svg 
//                     className="w-4 h-4 text-gray-200 group-hover:text-gray-950"
//                     fill="none" 
//                     viewBox="0 0 24 24"
//                     strokeWidth={3}
//                     stroke="currentColor">
//                       <path 
//                       stroke="currentColor"
//                       d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
//                       />
//                   </svg>
//               </button>
  
//               {/* MOBILE OVERLAY SEARCH */}
//               {openSearch && (
//                 <div className="fixed top-0 left-0 w-full h-13 z-[60] bg-gray-950 px-4 flex items-center gap-3">
//                   <svg 
//                     className="w-4 h-4 text-gray-200"
//                     fill="none" 
//                     viewBox="0 0 24 24"
//                     strokeWidth={2}
//                     stroke="currentColor">
//                       <path 
//                       stroke="currentColor" 
//                       d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
//                       />
//                   </svg>
  
//                   <input
//                     autoFocus
//                     type="text"
//                     placeholder="Search"
//                     required
//                     className="
//                       flex-1 bg-transparent
//                       border-0 border-b border-gray-600
//                       px-0 py-1
//                       text-sm text-gray-100
//                       placeholder-gray-500
//                       focus:outline-none focus:ring-0
//                       focus:border-indigo-400
//                     "
//                   />
  
//                   <button
//                     onClick={() => setOpenSearch(false)}
//                     className="text-gray-400 hover:text-gray-200 transition"
//                   >
//                     ✕
//                   </button>
//                 </div>
//               )}
  
//               <div onClick={toggleTheme} className="border border-white text-gray-200 rounded-md hover:bg-gray-300 hover:text-gray-950 transition">
//                 <button className="hidden dark:block">
//                 <span className="group inline-flex shrink-0 justify-center items-center size-8 stroke-2">
//                   <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
//                 </span>
//               </button>
//               <button className="block dark:hidden">
//                 <span className="group inline-flex shrink-0 justify-center items-center size-8 stroke-2">
//                   <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
//                 </span>
//               </button>
//               </div>
  
//               {/* EXPORT/IMPORT BUTTON */}
//               <div className="relative group inline-block group">
//                 <button 
//                   title="IMPORT/EXPORT FILE"
//                   className="p-1 transition border border-white text-gray-200 rounded-md hover:bg-gray-300 hover:text-gray-950 transition" 
//                   onClick={() => showModalFile(true)} > 
//                   <FontAwesomeIcon icon={faFileImport} size="xl" />
//                 </button>
  
//                 {/* TOOLTIP IN PROGRESS */}
//                 <div
//                   className="
//                     top-full left-1/2 -translate-x-1/2 mt-2 z-50
//                     hidden
//                     pointer-events-none
//                     transition-opacity duration-200
//                     bg-black/80 text-white text-xs px-2 py-1 rounded-md
//                     whitespace-nowrap
//                   ">
//                   Import/Export File
//                 </div>
//               </div>
  
//             </div>  
    
//           </div>
//         </header>
        
//         {/* THEME BACKGROUND */}
//         <div className={`relative min-h-screen w-full min-w-0 mx-auto px-1 transition-colors transition duration-300 bg-white text-black dark:bg-gray-800 dark:text-white backdrop-blur-lg`}>    
          
//           {/* MAIN PARENT CONTAINER */}
//           <div className="w-full mx-auto flex justify-center gap-2 pt-15">
            
//             {/* LEFT SIDE CONTAINER */}
//             <div className="hidden xs:block flex-1 relative">
  
//               {/* ADD BOOK FORM SUBMIT */}
//               {currentBookId === null && (
//                 <div className="sticky top-15">
  
//                   <div className="flex-1 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900 mb-2 p-3 flex justify-between transition duration-300">
  
//                     <h3 className="text-2xl font-semibold">Create New Book</h3>
  
//                     <div className="flex justify-center">
//                       <button 
//                         value={bookTitle}
//                         className="border-gray-500 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 px-2 dark:border-white dark:text-white"
//                         onClick={addBooksState}>
//                           {Addnewbooks ? <FontAwesomeIcon icon={faPlus} size="xs" className="transition duration-500"/> : <FontAwesomeIcon icon={faMinus} size="xs"/>}
//                       </button>
//                     </div>
  
//                   </div>
  
//                   {/* CREATE NEW BOOK FORM */}
//                   {(!Addnewbooks && 
                  
//                   <div className="flex-1 rounded-md shadow-lg p-3 bg-gray-100 dark:bg-gray-900 transition duration-300 animate-fadeDown">
//                     <form className="space-y-2">
                    
//                     {/* Title */}
//                     <div>
//                       <label className="block text-sm font-medium mb-1">
//                         Title
//                       </label>
//                       <input
//                         className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
//                         value={bookTitle}
//                         onChange={e => setBookTitle(e.target.value)}
//                         onKeyDown={(e) => {
//                             if (e.key === "Enter") addBook();
//                           }}
//                         title="Add new book"
//                         placeholder="Enter book title"
//                       />
//                     </div>
  
//                     {/* Summary */}
//                     <div>
//                       <label className="block text-sm font-medium mb-1">
//                         Summary
//                       </label>
//                       <textarea
//                         rows={4}
//                         className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
//                         placeholder="Enter book summary"
//                         onFocus={(e) => autoResize(e)}
//                         value={bookSummary}
//                         onChange={e => setBookSummary(e.target.value)}
//                         onBlur={(e) => { e.currentTarget.style.height = "auto";}}
//                       />
//                     </div>
  
//                     {/* SAMPLE GENRE */}
//                     <div>
//                       <label className="block text-sm font-medium mb-1">
//                         Book Genre
//                       </label>
//                       <input
//                         className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
//                         placeholder="Enter genre separated by comma"
//                         value={bookGenre}
//                         onChange={e => setBookGenre(e.target.value)}
//                       />
//                     </div>
  
//                     {/* Current Volume */}
//                     <div>
//                       <label className="block text-sm font-medium mb-1">
//                         Current Volume
//                       </label>
//                       <input
//                         type="number"
//                         className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
//                         placeholder="0"
//                         onChange={e => setBookVolume(e.target.value)}
//                       />
//                     </div>
  
//                     <button
//                       type="button"
//                       className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
//                       onClick={addBook}
//                     >
//                       SAVE
//                     </button>
//                     </form>
//                   </div>)}
                  
                  
//                 </div>
//               )}
  
//               {/* BOOK AND CHARACTER FORMS LEFT PANEL */}
//               {currentBookId !== null && currentBook &&  !selectedCharacter &&(
//                 <div className="sticky top-15 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">
  
//                   {/* BOOK SUMMARY TITLE */}
//                   <div className="flex-1 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900 mb-2 p-3 flex justify-between transition duration-300">
  
//                     <h3 className="text-2xl font-semibold">Book Details</h3>
  
//                     <div className="flex justify-center">
//                       <button 
//                         value={bookTitle}
//                         className="border-gray-500 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 px-2 dark:border-white dark:text-white"
//                         onClick={addBooksState}>
//                           {Addnewbooks ? <FontAwesomeIcon icon={faPlus} size="xs" className="transition duration-500"/> : <FontAwesomeIcon icon={faMinus} size="xs"/>}
//                       </button>
//                     </div>
  
//                   </div>
  
//                   {/* BOOK SUMMARY FORM */}
//                   {!Addnewbooks && (
                  
//                   // BOOK DETAILS
//                   <div className="flex-1 rounded-md shadow-lg p-3 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300 animate-fadeDown">
//                     <form className="space-y-2">
  
//                       {/* Summary */}
//                       <div>
//                         <label className="block text-xs mb-1">
//                           Summary / Synopsis
//                         </label>
//                         <textarea
//                           rows={8}
//                           className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600 text-area-scroll"
//                           placeholder="Update book summary"
//                           value={bookSummary}
//                           onFocus={(e) => autoResize(e)}
//                           onBlur={(e) => { e.currentTarget.style.height = "auto";}}
//                           onChange={e => setBookSummary(e.target.value)}
//                         />
//                       </div>
  
//                       {/* SAMPLE GENRE */}
//                     <div>
//                       <label className="block text-sm font-medium mb-1">
//                         Book Genre
//                       </label>
//                       <input
//                         className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
//                         placeholder="Enter genre separated by comma"
//                         value={bookGenre}
//                         onChange={e => setBookGenre(e.target.value)}
//                       />
//                     </div>
  
//                       {/* Current Volume */}
//                       <div>
//                         <label className="block text-xs font-medium mb-1">
//                           Current Volume
//                         </label>
//                         <input
//                           type="number"
//                           className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-600"
//                           value={bookVolume}
//                           placeholder="Update current book volume"
//                           onChange={e => setBookVolume(String (e.target.value))}
//                         />
//                       </div>
  
//                       <button
//                         type="button"
//                         className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
//                         onClick={() => {updateBookDetails(currentBookId, bookSummary, Number(bookVolume), bookGenre)}}
//                       >
//                         SAVE
//                       </button>
//                     </form>
//                   </div>
  
//                   )}
  
  
//                   {/* ADD CHARACTER TITLE  */}
//                   <div className="flex-1 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900 mb-2 p-3 flex justify-between transition duration-300">
  
//                     <h3 className="text-2xl font-semibold">Add Character</h3>
  
//                     <div className="flex justify-center">
//                       <button 
//                         value={bookTitle}
//                         className="border-gray-500 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 px-2 dark:border-white dark:text-white"
//                         onClick={addNewcharacter}>
//                           {addCharacterState ? <FontAwesomeIcon icon={faPlus} size="xs" className="transition duration-500"/> : <FontAwesomeIcon icon={faMinus} size="xs"/>}
//                       </button>
//                     </div>
  
//                   </div>
  
//                   {/* ADD CHARACTER FORM */}
//                   {(!addCharacterState &&
//                     <div className="flex-1 rounded-md shadow-lg p-3 mb-2 bg-gray-100 dark:bg-gray-900 transition duration-300 animate-fadeDown"
//                         onKeyDown={(e) => {if (e.key === "Enter") addCharacter();}}>
//                       <input className="border p-2 w-full mb-2 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
//                       <input className="border p-2 w-full mb-2 rounded" placeholder="Role / Affiliation" value={role} onChange={e => setRole(e.target.value)} />
//                       <textarea className="border p-2 w-full mb-2 rounded" placeholder="Notes" rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
//                       <input className="border p-2 w-full mb-2 rounded" placeholder="Abilities (comma separated)" value={abilities} onChange={e => setAbilities(e.target.value)} />
//                       <input type="number" className="border p-2 w-full mb-2 rounded" placeholder="First Chapter Appearance" value={chapterAppearance} onChange={e => setChapterAppearance(e.target.value)} />
//                       <button
//                         type="button"
//                         className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
//                         onClick={addCharacter}
//                       >
//                         SAVE
//                       </button>
//                     </div>
//                   )}
  
//                 </div>
//               )}
  
//               {/* CHARACTER CARD IN CHAR PAGE, left side */}
//               {currentBook && selectedCharacter && originalCharacter && (
//               <div className="sticky top-15 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">
    
//                 <div className="px-4 py-6 bg-[#0f172a] border-r border-slate-700">
  
//                   {/* IMAGE */}
//                   <div className="flex flex-col items-center">
//                     <div onClick={() => console.log(originalCharacter)} className="w-40 h-56 rounded-xl overflow-hidden shadow-lg border border-slate-700">
//                       <img
//                             src={imageMap[selectedCharacter] || char_image}
//                             alt={originalCharacter.name}
//                             className="w-full h-full object-cover rounded"
//                           />
//                     </div>
//                   </div>
  
//                   {/* NAME + ROLE */}
//                   <div className="mt-6 text-center">
//                     <h2 className="text-xl font-semibold text-white">
//                       {originalCharacter.name}
//                     </h2>
  
//                     <p className="text-sm text-slate-400 mt-1">
//                       {originalCharacter.role}
//                     </p>
  
//                     {/* STATUS + IMPORTANCE */}
//                     <div className="flex justify-center gap-2 mt-3 flex-wrap">
//                       <span className="px-3 py-1 text-xs rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
//                         {originalCharacter.status}
//                       </span>
  
//                       <span className="px-3 py-1 text-xs rounded-full bg-purple-600/20 text-purple-400 border border-purple-600/30">
//                         {originalCharacter.importance}
//                       </span>
//                     </div>
//                   </div>
  
//                   {/* QUICK INFO */}
//                   <div className="mt-8">
//                     <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">
//                       Quick Info
//                     </h3>
  
//                     <div className="flex flex-wrap gap-2">
//                       {originalCharacter.setRace?.map((race, i) => (
//                         <span
//                           key={i}
//                           className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded-md"
//                         >
//                           {race}
//                         </span>
//                       ))}
  
//                       {originalCharacter.occupation && (
//                         <span className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded-md">
//                           {originalCharacter.occupation}
//                         </span>
//                       )}
  
//                       {originalCharacter.powerLevel && (
//                         <span className="px-2 py-1 text-xs bg-slate-700 text-slate-200 rounded-md">
//                           {originalCharacter.powerLevel}
//                         </span>
//                       )}
//                     </div>
//                   </div>
  
//                   {/* DIVIDER */}
//                   <div className="my-8 border-t border-slate-700" />
  
//                   {/* RELATIONSHIP PREVIEW */}
//                   <div>
//                     <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3">
//                       Relationships
//                     </h3>
  
//                     <div className="space-y-5 grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
//                       {originalCharacter.relationships?.slice(0, 6).map((rel, i) => (
//                         <div
//                           key={i}
//                           className="cursor-pointer place-items-center"
//                         >
//                           <div >
//                             <div 
//                               className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-slate-700 hover:scale-106 hover:border-slate-300 transition"
//                               onClick={() => { openCharacterRel(rel.charId); }}
//                             >
//                               <img
//                                 src={imageMap[rel.charId] || char_image}
//                                 className="w-full h-full object-cover rounded"
//                               />
//                             </div>
//                           </div>
//                           {/* <span className="text-sm text-white">
//                             {rel.charId}
//                           </span> */}
//                           {/* <span className="text-xs text-slate-400">
//                             {rel.type}
//                           </span> */}
//                         </div>
//                       ))}
  
//                       {originalCharacter.relationships?.length === 0 && (
//                         <p className="text-xs text-slate-500">
//                           No relationships added.
//                         </p>
//                       )}
//                     </div>
//                   </div>
  
//                 </div>
  
//               </div>
//               )}
  
//             </div>
            
//             {/* CENTER CONTAINER */}
//             <div className="w-full max-w-3xl mx-auto">
  
//               {/* BOOK LIST / HOMEPAGE */}
//               {currentBookId === null && (
//                 // BOOK LIST PAGE
//                 <div className="p-3 mb-3 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900">
                  
//                   <div className="py-4 gap-2 flex xs:hidden">
  
//                     <input
//                     className="border-b-1 border-gray-200 px-1 w-full outline-none hover:border-gray-500 transition text-gray-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
//                     placeholder="New Book Title"
//                     value={bookTitle}
//                     onChange={e => setBookTitle(e.target.value)}
//                     onKeyDown={(e) => {
//                         if (e.key === "Enter") addBook();
//                       }}
//                     title="Add new book"
//                     />
  
//                     <button 
//                       onClick={addBook} 
//                       title="Add book title"
//                       className="border-gray-200 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 p-1 transition dark:border-white dark:text-white"
//                     >
//                       <FontAwesomeIcon icon={faPlus} size="lg"/>
//                     </button>
  
//                     {/* Conditional "Successfully Added" message */}
//                     <div className="absolute mt-9">
//                       {bookAdded && (
//                         <span className="mt-2 text-sm text-green-600 font-semibold animate-pulse">
//                           Book Successfully Added!
//                         </span>
//                       )}
//                     </div>
                    
//                   </div>
  
//                   {/* SHOW BOOK LIST */}
//                   {/* BOOK CARDS */}
//                   <h2 className="text-2xl font-semibold">My Books</h2>
  
//                   {!books.length && (
//                     <div className="w-full flex justify-center items-center py-20 px-10"> 
//                       <h1 className="text-3xl font-bold text-gray-400 text-center">
//                         PLEASE ADD BOOKS HERE. INSTEAD OF JUST LETTING THEM GATHER DUST IN YOUR INSANE MIND...
//                       </h1>
//                     </div>
//                   )}
                  
//                   <div className="grid grid-cols-2 px-15 pt-2 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-x-20 md:gap-y-5 pb-1 place-items-center overflow-y-auto notes-scroll">
//                       {books.map(book => (
//                       <div
//                         role="list"
//                         key={book.id} 
//                         draggable
//                         onDragStart={handleDragStart}
//                         data-id={book.id}
//                         data-title={book.title}
//                         onDragEnd={() => { setDraggingId(null); setIsDraggingBook(false);}}
//                         onClick={() => selectBook(book.id!)}
//                         className={`
//                           relative group cursor-pointer
//                           w-55 h-70 rounded-tl-xl rounded-bl-xl
//                           bg-gradient-to-br from-gray-100 to-gray-50
//                           dark:bg-gradient-to-br dark:from-gray-600 dark:to-gray-500
//                           shadow-lg
//                           hover:-translate-y-2 hover:shadow-2xl
//                           transition-all duration-300 animate-fadeDown
//                           ${draggingId === book.id ? "opacity-0" : ""}
//                           `}>
//                         {/* Spine and bottom pages design */}
//                         <div
//                           className="absolute -bottom-0 w-full h-0.5
//                             bg-gray-400
//                             rounded-tl-lg"/>
//                         <div
//                           className="absolute -left-1 top-0 h-full w-4
//                             bg-gray-400
//                             rounded-tl-lg"/>
                        
  
//                         {/* Title */}
//                         <div className="p-4 pt-15 text-base text-center font-semibold line-clamp-5 max-h-45">
//                           {book.title}
  
//                           {/* Vertical TITLE */}
//                           <div className="absolute text-white text-outline-2 -left-2 top-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-rl] truncate line-clamp-1 max-h-50">
//                             <span className="text-xs font-bold">{book.title}</span>
//                           </div>
//                         </div>
//                         <p className="text-center text-sm">Status: {upcaseLetter(book.status)}</p>
                        
//                       </div>
//                       ))}
//                   </div>  
                  
  
  
//                 </div>
//               )}
  
//               {/* DETAILS / CHARACTERS Display */}
//               {currentBookId !== null && currentBook && selectedCharacter === null && (
//                   <div className="px-3 pt-3 mb-3 rounded-md shadow-lg bg-gray-100 dark:bg-gray-900">
//                     {/* BACK BUTTON */}
//                     <div className="">
//                       <button 
//                         onClick={() => {setCurrentBookId(null); setMode("user"); setDraftNote(null); setBookSummary(""); setBookVolume(""); setCharacters([]); setCharDescription({ ...defaultcharDescription });}} 
//                       > <FontAwesomeIcon className="hover:text-blue-500 transition duration-300 hover:scale-105" icon={faArrowLeftLong} size="xl"/>
//                       </button>
//                     </div>
                    
//                     {/*CHANGEABLE CURRENT BOOK TITLE */}
//                     <div className="flex items-center gap-3 mb-4">
//                       <div className="flex-1">
//                         <input 
//                           title="Edit book title..."
//                           className="text-2xl w-full text-center font-semibold border-b-1 border-gray-200 hover:border-gray-500 outline-none focus-ring-0 truncate" 
//                           value={titleDraft}
//                           onChange={(e) => setTitleDraft(e.target.value)}
//                           onBlur={saveBookTitle}
//                           onKeyDown={(e) => {
//                             if (e.key === "Enter") {
//                               e.preventDefault();
//                               (e.target as HTMLElement).blur();
//                             }
//                           }}
//                         />
                        
//                       </div>
  
//                       {/* THIS IS THE HIDDEN ADD CHARACTER FORM FOR SMALLER DIMENSION */}
//                       <button 
//                         onClick={() => setShowAddCharacter(!showAddCharacter)} 
//                         className="xs:hidden bg-black border border-black text-white text-xs md:text-base px-5 py-2 rounded-md hover:bg-gray-800 transition">
//                           {showAddCharacter ? 'Cancel' : 'Add Character'}
//                       </button>
//                     </div>
  
//                     {/* Input Character Details */}
//                     {showAddCharacter && (
//                         <div className="bg-white/30 shadow rounded-md p-4 mb-6 flow-root">
//                           <input className="border p-2 w-full mb-2 rounded" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
//                           <input className="border p-2 w-full mb-2 rounded" placeholder="Role / Affiliation" value={role} onChange={e => setRole(e.target.value)} />
//                           <textarea className="border p-2 w-full mb-2 rounded" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
//                           <input className="border p-2 w-full mb-2 rounded" placeholder="Abilities (comma separated)" value={abilities} onChange={e => setAbilities(e.target.value)} />
//                           <input type="number" className="border p-2 w-full mb-2 rounded" placeholder="Volume" value={chapterAppearance} onChange={e => setChapterAppearance(e.target.value)} />
//                           <button onClick={addCharacter} className="float-right bg-black border border-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">Confirm</button>
//                         </div>
//                     )}
  
//                     {/* DISPLAY IF CHARACTERS ARE NONE */}
//                     {character.length === 0 && (
//                     <div className="w-full flex justify-center items-center py-20"> 
//                       <h1 className="text-3xl font-bold text-gray-400 text-center"> 
//                         PLEASE ADD SOME CHARACTERS. IT GETS LONELY SOMETIMES HERE... 
//                       </h1> 
//                     </div>
//                     )}
  
//                     {/* Display Character Card Block */}
//                     <div className="grid gap-4 pb-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 items-stretch place-items-center">
//                       {currentCharacters.map(char => (
  
//                       // CHARACTER CARDS w/ image... //
//                       <div 
//                       key={char.id} 
//                       title="Open character sheet."
//                       className="
//                         h-[230px] w-full max-w-sm
//                         cursor-pointer bg-white shadow-lg rounded-md
//                         transition-all duration-300
//                         hover:-translate-y-2 hover:shadow-2xl
//                         group animate-fadeDown
//                         flex flex-col
//                         dark:bg-gray-950"
//                       onClick={() => openEditCharacter(char)}
//                       >
  
//                           {/* IMAGE */}
//                           <div className="h-100 w-full overflow-hidden rounded-t-xl">
//                             <a href="#">
//                                 <img 
//                                 className="h-full w-full object-cover group-hover:scale-105 transition" 
//                                 src={imageMap[char.id] || char_image}
//                                 alt="Default Character Image" />
//                             </a>
//                           </div>
  
//                           <div className="flex-1 p-2 text-center">
//                               <a href="#">
//                                   <h3 className="text-xl font-semibold tracking-tight line-clamp-1">{char.name}</h3>
//                                   <p className="text-sm text-gray-400 line-clamp-1">{char.role || "Character Role"}</p>
//                                   <p className="text-xs text-gray-400 line-clamp-1">Status: {char.status}</p>
//                               </a>
//                           </div>
//                       </div>
//                       ))}
//                     </div>
  
//                     {/* // PAGINATION   */}
//                     {character.length >= 13 && (
//                       <div className="flex items-center justify-between pb-2 flex-wrap">
  
//                         {/* Previous */}
//                         <button
//                           onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                           disabled={currentPage === 1}
//                           className="px-3 py-1 bg-gray-300 dark:bg-gray-500 rounded disabled:opacity-50"
//                         >
//                           Prev
//                         </button>
  
//                         <div className="flex items-center gap-2">
//                           {/* First page shortcut */}
//                           {currentPage > 3 && (
//                             <>
//                               <button
//                                 onClick={() => setCurrentPage(1)}
//                                 className="px-3 py-1 bg-gray-300 dark:bg-gray-500 rounded"
//                               >
//                                 1
//                               </button>
//                               <span>...</span>
//                             </>
//                           )}
  
//                           {/* Page Numbers */}
//                           {getPageNumbers().map(page => (
//                             <button
//                               key={page}
//                               onClick={() => setCurrentPage(page)}
//                               className={`px-3 py-1 rounded ${
//                                 currentPage === page
//                                   ? "bg-blue-500 text-white"
//                                   : "bg-gray-300 dark:bg-gray-500"
//                               }`}
//                             >
//                               {page}
//                             </button>
//                           ))}
  
//                           {/* Last page shortcut */}
//                           {currentPage < totalPages - 2 && (
//                             <>
//                               <span>...</span>
//                               <button
//                                 onClick={() => setCurrentPage(totalPages)}
//                                 className="px-3 py-1 bg-gray-300 dark:bg-gray-500 rounded"
//                               >
//                                 {totalPages}
//                               </button>
//                             </>
//                           )}
//                         </div>
  
//                         {/* Next */}
//                         <button
//                           onClick={() =>
//                             setCurrentPage(prev => Math.min(prev + 1, totalPages))
//                           }
//                           disabled={currentPage === totalPages}
//                           className="px-3 py-1 bg-gray-300 dark:bg-gray-500 rounded disabled:opacity-50"
//                         >
//                           Next
//                         </button>
  
//                       </div>
//                     )}
  
//                   </div>
//               )}
  
//               {/* CHARACTER DATA PAGE / EDIT CHAR DETAILS */}
//               {selectedCharacter !== null && editingCharacter && originalCharacter &&(
//                 <div className="rounded-md shadow-lg pt-3 mb-3 bg-gray-100 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
                  
//                   {/* FUNCTION SETTINGS */}
//                   <div className="flex justify-between pb-3 px-3 relative">
//                     <button
//                       onClick={() => {setSelectedCharacter(null); setcharEditing(false); setMode("book"); setDraftNote(null); setCharDescription({ ...defaultcharDescription });}}
//                     >
//                       <FontAwesomeIcon className="hover:text-blue-500 transition hover:scale-105" icon={faArrowLeftLong} size="xl"/>
//                     </button>
  
//                     <div className="flex items-center gap-3">
//                       {charEditing && <FontAwesomeIcon icon={faSpinner} size="xl" spin />}
//                       {!charEditing && <FontAwesomeIcon className="text-emerald-500" icon={faCheck} size="xl" />}
  
//                       <button
//                         title="Character actions"
//                         className="border-gray-300 border rounded p-2 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
//                         onClick={() => setShowCharacterActions(prev => !prev)}
//                       >
//                         <FontAwesomeIcon icon={faGear} />
//                       </button>
  
//                       {showCharacterActions && (
//                         <div className="absolute right-3 top-12 z-20 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700 p-2 space-y-2">
//                           <button
//                             title="Generate character image"
//                             onClick={() => {setShowGenImage(true); showUploadCharImage(true); setShowCharacterActions(false);}}
//                             className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
//                           >
//                             <FontAwesomeIcon icon={faPlus} className="mr-2"/>Generate Image
//                           </button>
  
//                           <button
//                             onClick={() => {deleteCharacter(editingCharacter.id); setShowCharacterActions(false);}}
//                             className="w-full text-left px-2 py-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
//                           >
//                             <FontAwesomeIcon icon={faTrashCan} className="mr-2"/>Delete Character
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
  
//                   {/* CHARACTER CARD AND IMAGE FORMAT */}
//                   <div
//                     className="space-y-2"
//                     onFocus={() => setcharEditing(true)}
//                     onChange={() => setonChange(true)}
//                     onBlur={updateCharacter}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter") {
//                         e.preventDefault();
//                         (e.target as HTMLElement).blur();
//                       }
//                     }}
//                   >
  
//                     {/* IMAGE + BASIC INFO */}
//                     {/* <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] rounded-t-lg bg-gray-50 dark:bg-gray-950">
                      
//                       <div className="w-full h-50 sm:h-50 rounded-t-lg overflow-hidden p-1">
//                         <img
//                           src={imageMap[selectedCharacter] || char_image}
//                           alt="Character Image"
//                           className="w-full h-full object-cover rounded"
//                         />
//                       </div>
  
//                       <div className="flex flex-col p-2 gap-2">
//                         <input
//                           className="w-full text-xl font-semibold outline-none focus:border-b hover:border-b"
//                           value={editingCharacter.name}
//                           onChange={e => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
//                           placeholder="Character Name"
//                         />
//                         <div>
//                           <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
//                           <input
//                             placeholder="Add Character Role"
//                             className="w-full pl-3 outline-none focus:border-b hover:border-b"
//                             value={editingCharacter.role}
//                             onChange={e => setEditingCharacter({ ...editingCharacter, role: e.target.value })}
//                           />
//                         </div>
//                       </div>
//                     </div> */}
  
//                     <div className="px-2">
//                       <div className="flex flex-wrap gap-2 border-b border-gray-300 dark:border-gray-700 pb-2">
//                         {characterDetailTabs.map(tab => (
//                           <button
//                             key={tab.key}
//                             onClick={() => setActiveCharacterTab(tab.key)}
//                             className={`px-3 py-1 rounded-full text-sm transition ${
//                               activeCharacterTab === tab.key
//                                 ? "bg-blue-600 text-white"
//                                 : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300"
//                             }`}
//                           >
//                             {tab.label}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
  
//                     <div className="pr-2 pl-2 pb-4">
//                       {activeCharacterTab === "overview" && (
//                         <div className="space-y-3">
//                           <div>
//                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Short Description</label>
//                             <textarea
//                               rows={3}
//                               className="w-full rounded-md pl-3 hover:border"
//                               placeholder="Short character summary"
//                               value={editingCharacter.notes}
//                               onChange={e => setEditingCharacter({ ...editingCharacter, notes: e.target.value })}
//                             />
//                           </div>
  
//                           <div>
//                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Personality Traits</label>
//                             <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
//                               {originalCharacter.personalityTraits?.length > 0
//                                 ? originalCharacter.personalityTraits.join(", ")
//                                 : "No personality traits added."}
//                             </p>
//                           </div>
  
//                           <div>
//                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Core Motivation</label>
//                             <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
//                               {originalCharacter.futureNotes || "No core motivation added yet."}
//                             </p>
//                           </div>
  
//                           <div>
//                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Character Arc Summary</label>
//                             <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
//                               {originalCharacter.characterArc || "No character arc summary added."}
//                             </p>
//                           </div>
//                         </div>
//                       )}
  
//                       {activeCharacterTab === "background" && (
//                         <div className="space-y-1">
//                           <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Background</label>
//                           <textarea
//                             rows={10}
//                             className="w-full rounded-md pl-3 hover:border"
//                             placeholder="Full character backstory"
//                             value={editingCharacter.notes}
//                             onChange={e => setEditingCharacter({ ...editingCharacter, notes: e.target.value })}
//                           />
//                         </div>
//                       )}
  
//                       {activeCharacterTab === "abilities" && (
//                         <div className="space-y-3">
//                           <div>
//                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Abilities List</label>
//                             <input
//                               className="w-full rounded-md pl-3 py-1 outline-none hover:border"
//                               value={editingCharacter.abilitiesText}
//                               onChange={(e) => setEditingCharacter({ ...editingCharacter, abilitiesText: e.target.value })}
//                               placeholder="Add abilities"
//                             />
//                           </div>
  
//                           <div>
//                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Power System / Power Level</label>
//                             <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
//                               {originalCharacter.powerLevel || "No power system details added."}
//                             </p>
//                           </div>
  
//                           <div>
//                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Strengths / Weaknesses</label>
//                             <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
//                               {originalCharacter.tags?.length > 0
//                                 ? originalCharacter.tags.join(", ")
//                                 : "No strengths/weaknesses tagged."}
//                             </p>
//                           </div>
  
//                           <div>
//                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Chapter Appearances</label>
//                             <input
//                               placeholder="Chapter Appearances"
//                               className="w-full rounded-md pl-3 py-1 outline-none hover:border"
//                               value={editingCharacter.chapters}
//                               onChange={(e) => setEditingCharacter({ ...editingCharacter, chapters: e.target.value })}
//                             />
//                           </div>
//                         </div>
//                       )}
  
//                       {activeCharacterTab === "relationships" && (
//                         <div className="space-y-3">
//                           <div className="flex items-center gap-2">
//                             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Filter by type</label>
//                             <select
//                               className="rounded border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1"
//                               value={relationshipTypeFilter}
//                               onChange={(e) => setRelationshipTypeFilter(e.target.value)}
//                             >
//                               <option value="all">All</option>
//                               {[...new Set((originalCharacter.relationships ?? []).map(rel => rel.type).filter(Boolean))].map(type => (
//                                 <option key={type} value={type}>{type}</option>
//                               ))}
//                             </select>
//                           </div>
  
//                           <div className="space-y-2">
//                             {(originalCharacter.relationships ?? [])
//                               .filter(rel => relationshipTypeFilter === "all" || rel.type === relationshipTypeFilter)
//                               .map((rel, idx) => {
//                                 const relatedCharacter = character.find(c => c.id === rel.charId);
  
//                                 return (
//                                   <button
//                                     key={`${rel.charId}-${idx}`}
//                                     className="w-full flex items-center justify-between p-2 rounded-md bg-gray-200/60 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
//                                     onClick={() => {
//                                       if (relatedCharacter) {
//                                         openEditCharacter(relatedCharacter);
//                                         return;
//                                       }
  
//                                       void openCharacterById(rel.charId);
//                                     }}
//                                   >
//                                     <span className="text-left">
//                                       <span className="block text-sm font-semibold">{relatedCharacter?.name ?? `Character #${rel.charId}`}</span>
//                                       <span className="block text-xs text-gray-600 dark:text-gray-400">{rel.type || "Unknown"}</span>
//                                     </span>
//                                     <span className="text-xs text-blue-500">Open</span>
//                                   </button>
//                                 );
//                               })}
  
//                             {(originalCharacter.relationships ?? []).length === 0 && (
//                               <p className="text-sm text-gray-600 dark:text-gray-400">No relationships added.</p>
//                             )}
//                           </div>
//                         </div>
//                       )}
  
//                       {activeCharacterTab === "appearance" && (
//                         <div className="space-y-2">
//                           {([
//                             ["basic", originalCharacter.description?.basic],
//                             ["face", originalCharacter.description?.face],
//                             ["hair", originalCharacter.description?.hair],
//                             ["body", originalCharacter.description?.body],
//                             ["extras", originalCharacter.description?.extras],
//                           ] as const).map(([section, values]) => (
//                             <div key={section} className="rounded-md border border-gray-300 dark:border-gray-700">
//                               <button
//                                 className="w-full flex justify-between items-center px-3 py-2 text-left font-medium capitalize"
//                                 onClick={() => setOpenAppearanceSections(prev => ({ ...prev, [section]: !prev[section] }))}
//                               >
//                                 <span>{section}</span>
//                                 <span>{openAppearanceSections[section] ? "−" : "+"}</span>
//                               </button>
  
//                               {openAppearanceSections[section] && (
//                                 <div className="px-3 pb-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
//                                   {Object.entries(values ?? {}).map(([key, value]) => (
//                                     <p key={key}>
//                                       <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1")}: </span>
//                                       {value || "—"}
//                                     </p>
//                                   ))}
//                                 </div>
//                               )}
//                             </div>
//                           ))}
//                         </div>
//                       )}
  
//                     </div>
//                   </div>  
  
  
//                 {/* CLOSER */}
//                 </div>  
//               )}
  
//             </div>
  
//             {/* RIGHT SIDE CONTAINER */}
//             <div className="hidden xs:block flex-1 flex flex-col relative">
              
//               {/* NOTES CONTAINER */}
//               <div className="PARENT CONTAINER FOR THE NOTES PANEL sticky top-15">
  
//                 {/* NOTES TITLE */}
//                 <div className="flex-1 rounded-md shadow-lg p-3 bg-gray-100 dark:bg-gray-900 mb-2 flex justify-between">
  
//                   <h3 
//                     onClick={displayNotes}
//                     className="text-2xl font-semibold cursor-pointer hover:text-blue-400 select-none"
//                     title="Click to minimize notes"
//                     role="button"
//                     >Notes</h3>
  
//                   <div className="flex justify-center">
//                     <button 
//                       value={bookTitle}
//                       className="border-gray-500 border-1 text-black rounded hover:bg-gray-300 hover:text-gray-950 px-2 transition dark:border-white dark:text-white"
//                       onClick={addDraftNotes}>
//                         <FontAwesomeIcon icon={faPlus} size="xs"/>
//                     </button>
//                   </div>
  
//                 </div>
  
//                   {/* NOTES CONTENTS */}
//                   { notesShowState && (
//                     <div className="h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden notes-scroll overflow-contain">
                      
//                       {/* THIS IS FOR THE USER NOTES */}
//                       {( currentBookId === null && !currentBookId &&
//                         <div 
//                           className=""
//                         >
//                           {[ ...(draftNote ? [draftNote] : []), ...userNotes ].map(notes => (
//                             <div 
//                               className={`${colorMap[notes.color]} relative p-1 rounded-md shadow-md mb-2 bg-gray-100 dark:bg-gray-900 cursor-pointer animate-fadeDown`}
//                               key={notes.id ?? notes.notesId}
//                               data-id={notes.id}
//                             >
  
//                               <div className="flex justify-between pb-1"> 
                                
//                                 <span className="text-xs text-gray-800 dark:text-gray-400">
//                                   {new Date(notes.createdAt).toLocaleString("en-US", {
//                                     month: "short",
//                                     day: "numeric",
//                                     year: "numeric",
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                   })}
//                                 </span>
  
//                                 <button 
//                                   className="hover:bg-neutral-300/50 rounded-2xl group"
//                                   onClick={() => {setNoteToDelete(notes);}}>
//                                   <svg
//                                     xmlns="http://www.w3.org/2000/svg"
//                                     className="h-5 w-5 text-gray-700 dark:text-gray-400 group-hover:text-red-500"
//                                     fill="none"
//                                     viewBox="0 0 24 24"
//                                     stroke="currentColor"
//                                     strokeWidth={2}
//                                   >
//                                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
//                                   </svg>
//                                 </button>
  
//                               </div>
                              
//                               <textarea
//                                 className="
//                                 w-full text-sm
//                                 rounded-md 
//                                 px-1
//                                 focus:outline-none focus:ring-2 focus:ring-blue-400 
//                                 hover:ring-blue-400 hover:ring-2
//                                 placeholder-gray-400 dark:placeholder-gray-400 
//                                 resize-none
//                                 overflow-hidden
//                                 transition-all duration-200
//                                 "
//                                 ref={!notes.id ? draftTextareaRef : null}
//                                 placeholder="Enter Notes"
//                                 onFocus={(e) => {autoResize(e); setOnFocusId(String(notes.id!)); setHideSave(true);
//                                   if (notes.id) {
//                                     setDraftstate(false);
//                                   }
//                                   else {
//                                     setDraftstate(true);
//                                   }
//                                 }}
//                                 rows={3}
//                                 value={notes.content}
//                                 onChange={(e) => {
//                                   if (!notes.id) {
//                                     // This is draft
//                                     setDraftNote(prev =>
//                                       prev ? { ...prev, content: e.target.value } : prev
//                                     );
//                                   } 
//                                   else {
//                                     // This is saved note
//                                     setUserNotes(prev =>
//                                       prev.map(note =>
//                                         note.id === notes.id
//                                           ? { ...note, content: e.target.value }
//                                           : note
//                                       )
//                                     );
//                                   }
//                                 }}
//                                 onKeyDown={(e) => {
//                                   if (e.key === "Enter" && !e.shiftKey) {
//                                     e.preventDefault();
//                                     (e.target as HTMLElement).blur();
//                                     (saveNote(notes));
//                                   }
//                                 }}
//                                 onBlur={(e) => { e.currentTarget.style.height = "auto";}}
//                               />
  
//                               {(hideSave && (notes.id ? Number(onFocusId) === notes.id : draftNoteState) &&
//                                 <div className="flex justify-end gap-1">
//                                   {/* {(notSaved &&
//                                     <span>Not saved</span>
//                                   )} */}
  
//                                   <button 
//                                     className="flex px-4 py-1 bg-neutral-500 rounded-xl hover:bg-neutral-600"
//                                     onClick={() => {setHideSave(false); setDraftNote(null);}}
//                                   >
//                                     Cancel
//                                   </button>
  
//                                   <button 
//                                     className="flex px-4 py-1 bg-blue-700 rounded-xl hover:bg-blue-800"
//                                     onClick={() => {saveNote(notes);}}
//                                   >
//                                     Save 
//                                   </button>
//                                 </div>
//                               )}
  
//                               {noteToDelete && noteToDelete.id === notes.id && (
//                                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-md z-10">
//                                   <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg text-center w-40">
//                                     <p className="text-sm mb-2">Delete this note?</p>
//                                     <div className="flex justify-between">
//                                       <button
//                                         onClick={() => handleDeleteNote(noteToDelete!)}
//                                         className="text-red-500 text-sm hover:scale-105"
//                                       >
//                                         Delete
//                                       </button>
//                                       <button
//                                         onClick={() => setNoteToDelete(null)}
//                                         className="text-gray-500 text-sm"
//                                       >
//                                         Cancel
//                                       </button>
//                                     </div>
//                                   </div>
//                                 </div>
//                               )}
  
//                             </div>
//                           ))}
//                         </div>
//                       )}
  
//                       {/* THIS IS THE BOOK NOTES */}
//                       {( currentBookId && currentBook && !selectedCharacter &&
//                         <div className="">
//                           {[ ...(draftNote ? [draftNote] : []), ...bookNotes ].map(notes => (
//                             <div 
//                               className={`${colorMap[notes.color]} relative p-1 rounded-md shadow-md mb-2 bg-gray-100 dark:bg-gray-900 cursor-pointer animate-fadeDown`}
//                               key={notes.id ?? notes.notesId}
//                               data-id={notes.id}
//                             >
  
//                               <div className="flex justify-between pb-1"> 
                                
//                                 <span className="text-xs text-gray-800 dark:text-gray-400">
//                                   {new Date(notes.createdAt).toLocaleString("en-US", {
//                                     month: "short",
//                                     day: "numeric",
//                                     year: "numeric",
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                   })}
//                                 </span>
  
//                                 <button 
//                                   className="hover:bg-neutral-300/50 rounded-2xl group"
//                                   onClick={() => setNoteToDelete(notes)}>
//                                   <svg
//                                     xmlns="http://www.w3.org/2000/svg"
//                                     className="h-5 w-5 text-gray-700 dark:text-gray-400 group-hover:text-red-500"
//                                     fill="none"
//                                     viewBox="0 0 24 24"
//                                     stroke="currentColor"
//                                     strokeWidth={2}
//                                   >
//                                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
//                                   </svg>
//                                 </button>
  
//                               </div>
                              
//                               <textarea
//                                 className="
//                                 w-full text-sm
//                                 rounded-md 
//                                 px-1
//                                 focus:outline-none focus:ring-2 focus:ring-blue-400 
//                                 hover:ring-blue-400 hover:ring-2
//                                 placeholder-gray-400 dark:placeholder-gray-400 
//                                 resize-none
//                                 overflow-hidden
//                                 transition-all duration-200
//                                 "
//                                 ref={!notes.id ? draftTextareaRef : null}
//                                 placeholder="Enter Notes"
//                                 onFocus={(e) => {autoResize(e); setOnFocusId(String(notes.id!)); setNoteContent(notes.content); setHideSave(true); 
//                                   if (notes.id) {
//                                     setDraftstate(false);
//                                   }
//                                   else {
//                                     setDraftstate(true);
//                                   }
//                                 }}
//                                 rows={3}
//                                 value={notes.content}
//                                 onChange={(e) => {
//                                   if (!notes.id) {
//                                     // This is draft
//                                     setDraftNote(prev =>
//                                       prev ? { ...prev, content: e.target.value } : prev
//                                     );
//                                   } else {
//                                     // This is saved note
//                                     setBookNotes(prev =>
//                                       prev.map(note =>
//                                         note.id === notes.id
//                                           ? { ...note, content: e.target.value }
//                                           : note
//                                       )
//                                     );
//                                   }
//                                 }}
//                                 onKeyDown={(e) => {
//                                   if (e.key === "Enter" && !e.shiftKey) {
//                                     e.preventDefault();
//                                     (e.target as HTMLElement).blur();
//                                     (saveNote(notes));
//                                   }
//                                 }}
//                                 onBlur={(e) => { e.currentTarget.style.height = "auto";}}
//                               />
  
//                               {(hideSave && (notes.id ? Number(onFocusId) === notes.id : draftNoteState) &&
//                                 <div className="flex justify-end gap-1">
//                                   {/* {(notSaved &&
//                                     <span>Not saved</span>
//                                   )} */}
  
//                                   <button 
//                                     className="flex px-4 py-1 bg-neutral-500 rounded-xl hover:bg-neutral-600"
//                                     onClick={() => {setHideSave(false); setDraftNote(null);}}
//                                   >
//                                     Cancel
//                                   </button>
  
//                                   <button 
//                                     className="flex px-4 py-1 bg-blue-700 rounded-xl"
//                                     onClick={() => {saveNote(notes);}}
//                                     disabled={noteContent === notes.content}
//                                   >
//                                     Save 
//                                   </button> 
//                                 </div>
//                               )}
  
//                               {noteToDelete && noteToDelete.id === notes.id && (
//                                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-md z-10">
//                                   <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg text-center w-40">
//                                     <p className="text-sm mb-2">Delete this note?</p>
//                                     <div className="flex justify-between">
//                                       <button
//                                         onClick={() => handleDeleteNote(noteToDelete!)}
//                                         className="text-red-500 text-sm hover:scale-105"
//                                       >
//                                         Delete
//                                       </button>
//                                       <button
//                                         onClick={() => setNoteToDelete(null)}
//                                         className="text-gray-500 text-sm"
//                                       >
//                                         Cancel
//                                       </button>
//                                     </div>
//                                   </div>
//                                 </div>
//                               )}
//                             </div>
//                           ))}
//                         </div>
//                       )}
  
//                       {/* THIS IS THE CHARACTER NOTES */}
//                       {( currentBookId && currentBook && selectedCharacter &&
//                         <div className="">
//                           {[ ...(draftNote ? [draftNote] : []), ...charNotes ].map(notes => (
//                             <div 
//                               className={`${colorMap[notes.color]} relative p-1 rounded-md shadow-md mb-2 bg-gray-100 dark:bg-gray-900 cursor-pointer animate-fadeDown`}
//                               key={notes.id ?? notes.notesId}
//                               data-id={notes.id}
//                             >
  
//                               <div className="flex justify-between pb-1"> 
                                
//                                 <span className="text-xs text-gray-800 dark:text-gray-400">
//                                   {new Date(notes.createdAt).toLocaleString("en-US", {
//                                     month: "short",
//                                     day: "numeric",
//                                     year: "numeric",
//                                     hour: "2-digit",
//                                     minute: "2-digit",
//                                   })}
//                                 </span>
  
//                                 <button 
//                                   className="hover:bg-neutral-300/50 rounded-2xl group"
//                                   onClick={() => setNoteToDelete(notes)}>
//                                   <svg
//                                     xmlns="http://www.w3.org/2000/svg"
//                                     className="h-5 w-5 text-gray-700 dark:text-gray-400 group-hover:text-red-500"
//                                     fill="none"
//                                     viewBox="0 0 24 24"
//                                     stroke="currentColor"
//                                     strokeWidth={2}
//                                   >
//                                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
//                                   </svg>
//                                 </button>
  
//                               </div>
                              
//                               <textarea
//                                 className="
//                                 w-full text-sm
//                                 rounded-md 
//                                 px-1
//                                 focus:outline-none focus:ring-2 focus:ring-blue-400 
//                                 hover:ring-blue-400 hover:ring-2
//                                 placeholder-gray-400 dark:placeholder-gray-400 
//                                 resize-none
//                                 overflow-hidden
//                                 transition-all duration-200
//                                 "
//                                 ref={!notes.id ? draftTextareaRef : null}
//                                 placeholder="Enter Notes"
//                                 onFocus={(e) => {autoResize(e); setOnFocusId(String(notes.id!)); setNoteContent(notes.content); setHideSave(true); 
//                                   if (notes.id) {
//                                     setDraftstate(false);
//                                   }
//                                   else {
//                                     setDraftstate(true);
//                                   }
//                                 }}
//                                 rows={3}
//                                 value={notes.content}
//                                 onChange={(e) => {
//                                   if (!notes.id) {
//                                     // This is draft
//                                     setDraftNote(prev =>
//                                       prev ? { ...prev, content: e.target.value } : prev
//                                     );
//                                   } else {
//                                     // This is saved note
//                                     setCharNotes(prev =>
//                                       prev.map(note =>
//                                         note.id === notes.id
//                                           ? { ...note, content: e.target.value }
//                                           : note
//                                       )
//                                     );
//                                   }
//                                 }}
//                                 onKeyDown={(e) => {
//                                   if (e.key === "Enter" && !e.shiftKey) {
//                                     e.preventDefault();
//                                     (e.target as HTMLElement).blur();
//                                     (saveNote(notes));
//                                   }
//                                 }}
//                                 onBlur={(e) => { e.currentTarget.style.height = "auto";}}
//                               />
  
//                               {(hideSave && (notes.id ? Number(onFocusId) === notes.id : draftNoteState) &&
//                                 <div className="flex justify-end gap-1">
//                                   {/* {(notSaved &&
//                                     <span>Not saved</span>
//                                   )} */}
  
//                                   <button 
//                                     className="flex px-4 py-1 bg-neutral-500 rounded-xl hover:bg-neutral-600"
//                                     onClick={() => {setHideSave(false); setDraftNote(null);}}
//                                   >
//                                     Cancel
//                                   </button>
  
//                                   <button 
//                                     className="flex px-4 py-1 bg-blue-700 rounded-xl"
//                                     onClick={() => {saveNote(notes);}}
//                                     disabled={noteContent === notes.content}
//                                   >
//                                     Save 
//                                   </button> 
//                                 </div>
//                               )}
  
//                               {noteToDelete && noteToDelete.id === notes.id && (
//                                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-md z-10">
//                                   <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg text-center w-40">
//                                     <p className="text-sm mb-2">Delete this note?</p>
//                                     <div className="flex justify-between">
//                                       <button
//                                         onClick={() => handleDeleteNote(noteToDelete!)}
//                                         className="text-red-500 text-sm hover:scale-105"
//                                       >
//                                         Delete
//                                       </button>
//                                       <button
//                                         onClick={() => setNoteToDelete(null)}
//                                         className="text-gray-500 text-sm"
//                                       >
//                                         Cancel
//                                       </button>
//                                     </div>
//                                   </div>
//                                 </div>
//                               )}
//                             </div>
//                           ))}
//                         </div>
//                       )}
  
//                     </div>
  
//                   )}
  
//               </div>
      
//             </div>
  
//           {/* MAIN PARENT CONTAINER DIV CLOSER */}
//           </div>
        
//         </div>
  
//         {/* OUT OF MAIN PAGE MODALS */}
  
//           {/* UPLOAD || GENERATE CHARACTER IMAGE*/}
//           {showGenImage && selectedCharacter && (
//               <div className="fixed inset-0 flex items-center bg-black/50 z-50 overflow-auto" 
//                 onMouseDown={(e) => {
//                   if (e.target === e.currentTarget) {
//                     showModal(false);
//                     setImageUrl(null);
//                     setImageFile(null);
//                     setPreviewUrl(null);
//                     showUploadCharImage(true);
//                   }
//                 }}
//               >
//                 {/* MAIN MODAL CONTENT */}
//                 <div className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-100 max-h-screen overflow-y-auto rounded-md shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
  
//                   {/* EXIT BUTTON AT THE TOP OF MODAL */}
//                   <div id="Close modal" className="flex justify-between pl-1">
//                     <button
//                       onClick={() => showUploadCharImage(!uploadCharImage)}
//                       className="px-1 text-sm hover:text-semibold hover:text-blue-500 hover:underline"
//                     >
//                       {uploadCharImage === true ? ('Generate...') : ('Upload')}
//                     </button>
  
//                     <button 
//                       className="hover:bg-neutral-300/50 rounded-2xl group"
//                       onClick={() => {
//                         showModal(false);
//                         setImageUrl(null);
//                         setImageFile(null);
//                         setPreviewUrl(null);
//                         showUploadCharImage(true);
//                       }}
//                     >
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="h-5 w-5 text-gray-700 dark:text-gray-800 group-hover:text-red-500"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                         strokeWidth={2}
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
//                       </svg>
//                     </button>
//                   </div>
  
//                   <div className="p-4">
                      
//                       {uploadCharImage ? 
//                         ( 
//                           // UPLOAD IMAGE
//                           <div>
//                             {/* UPLOAD YOUR CHARACTER IMAGE */}
//                             <div className="flex items-center justify-center w-full">
//                               <div 
//                                 {...getRootProps()}
//                                 className={`flex flex-col items-center justify-center w-full h-100 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-base cursor-pointer hover:bg-neutral-tertiary-medium ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}>
//                                   <input {...getInputProps()} 
//                                     accept="image/*"
//                                     onChange={(e) => {
//                                       if (e.target.files?.[0]) {
//                                       setImageFile(e.target.files[0]);
//                                       }
//                                     }}
//                                   />
  
//                                   {imageFile ? (
//                                     <div className="text-lg text-gray-500 truncate max-w-100">
//                                       <img
//                                         src={previewUrl ?? undefined}
//                                         alt="Generated character"
//                                         className="w-full h-full object-cover"
//                                       />
//                                     </div>
//                                   ) : (
//                                     <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
//                                         <svg className="w-8 h-8 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/></svg>
//                                         <p className="mb-2 text-sm"><span className="font-semibold">Click to upload character image</span></p>
//                                     </div>
//                                   )}
//                               </div>
//                             </div> 
  
//                             {/* Submit */}
//                             <div className="flex pt-3">
//                               <button
//                                 disabled={!imageFile}
//                                 onClick={() => convertUploadedImage(imageFile)}
//                                 className="border w-full bg-blue-500 px-4 py-2 text-white rounded-md hover:border hover:border-blue-900
//                                 text-white"> 
//                                 Save image
//                               </button>
//                             </div>
//                           </div>
//                         ) 
//                         :
//                         (
//                           // GENERATE IMAGE
//                           <div>
//                             {/* TITLE */}
//                             <h2 className="text-2xl font-bold text-gray-800 pb-2">
//                               Character Image Generator
//                             </h2>
  
//                             {/* ENTER PROMPT */}
//                             <div className="flex flex-col sm:flex-row gap-3 mb-3">
//                               <form className="flex w-full gap-1">
//                                 <input
//                                   type="text"
//                                   value={charprompt}
//                                   required
//                                   onChange={(e) => setcharPrompt(e.target.value)}
//                                   placeholder="e.g. A space pirate with a mechanical eye"
//                                   className="flex-1 px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                                 />
  
//                                 <button
//                                   onClick={generateImage}
//                                   disabled={loading}
//                                   className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
//                                 >
                                
//                                   {loading ? "Generating..." : "Generate"}
//                                 </button>
//                               </form>
//                             </div>
  
//                             {/* HANDLE ERROR */}
//                             {error && (
//                               <div className="text-red-500 text-sm">
//                                 {error}
//                               </div>
//                             )}
  
//                             {/* IMAGE PREVIEW */}
//                             <div className="w-full flex justify-center">
//                               <div className="w-72 h-96 bg-gray-200 rounded-md overflow-hidden shadow-inner flex items-center justify-center">
//                                 {loading && (
//                                   <div className="animate-pulse text-gray-400">
//                                     Generating image...Please wait
//                                   </div>
//                                 )}
  
//                                 {!loading && imageUrl && (
//                                   <img
//                                     src={imageUrl}
//                                     alt="Generated character"
//                                     className="w-full h-full object-cover"
//                                   />
//                                 )}
  
//                                 {!loading && !imageUrl && (
//                                   <div className="text-gray-400 text-sm">
//                                     Image will appear here
//                                   </div>
//                                 )}
//                               </div>
//                             </div>
  
//                             {/* SAVE IMAGE TO DB */}
//                             <div className="flex justify-center pt-3">
//                               <button 
//                               disabled={!imageSaved}
//                               className="py-2 px-6 w-full rounded-md bg-indigo-200 hover:bg-indigo-300 text-center"
//                               onClick={() =>saveImage(imageSaved)}
//                               >
//                                 Save
//                               </button>
                              
//                             </div>
//                             {/* <button onClick={checkimageUsage} className="rounded bg-blue-100 hover:bg-blue-300 p-4"> CHECK PLEASE </button> */}
  
//                           </div>
//                         )
//                       }
  
//                   </div>
                  
  
//                 </div>
                
//               </div>
//           )}
  
//           {/* EXPORT/IMPORT MODAL */}
//           {showFileModal && (
//               <div 
//               className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" 
//               onMouseDown={(e) => {
//                   if (e.target === e.currentTarget) {
//                     showModalFile(false);
//                   }
//                 }}>
//                 <div className="w-9/10 min-w-0 md:max-w-120 mx-auto bg-white dark:bg-gray-100 max-h-[90vh] overflow-y-auto p-6 rounded-md shadow-lg" onMouseDown={(e) => e.stopPropagation()}>
                  
//                   {/* DOWNLOAD YOUR DATA as JSON */}
//                   <div className="flex justify-between">
//                     <div>
//                       <h2 className="text-x1 font-bold">SAVE YOUR BOOKS</h2>
//                       <p className="text-sm text-gray-500">From your impulsive actions, save your file now.</p>
//                     </div>
//                     <div className="px-2">
//                       <button
//                         onClick={exportData}
//                         className="border bg-blue-500 px-4 py-2 text-white rounded-md hover:border hover:border-blue-900"> 
//                         Export Books
//                       </button>
//                     </div>
//                   </div>
  
//                   {/* DIVIDER LINE OR */}
//                   <div className="my-6 flex items-center">
//                     <div className="flex-grow border-t border-gray-300"></div>
//                     <span className="mx-4 text-sm text-gray-500 font-medium">OR</span>
//                     <div className="flex-grow border-t border-gray-300"></div>
//                   </div>
  
//                   {/* UPLOAD YOUR DOWNLOADED JSON FILE TO use in OTHER BROWSER */}
//                   <div className="flex items-center justify-center w-full">
//                       <div 
//                         {...getRootProps()}
//                         className={`flex flex-col items-center justify-center w-full h-35 bg-neutral-secondary-medium border border-dashed border-default-strong rounded-base cursor-pointer hover:bg-neutral-tertiary-medium ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}>
//                           <input {...getInputProps()} 
//                             accept=".json"
//                             onChange={(e) => {
//                               if (e.target.files?.[0]) {
//                               setSelectedFile(e.target.files[0]);
//                               }
//                             }}
//                           />
  
//                           {selectedFile ? (
//                             <span className="text-lg text-gray-500 truncate max-w-100">
//                                 {selectedFile.name}
//                               </span>
//                           ) : (
//                             <div className="flex flex-col items-center justify-center text-body pt-5 pb-6">
//                                 <svg className="w-8 h-8 mb-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"/></svg>
//                                 <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span></p>
//                                 <p className="text-xs">Exported file only, Json file.</p>
//                             </div>
//                           )}
//                       </div>
//                   </div> 
  
//                   {/* Submit */}
//                     <div className="flex justify-between mt-3">
//                       <div>
//                         <h2 className="text-x1 font-bold">EXTRICATE YOUR CHARACTERS</h2>
//                         <p className="text-sm text-gray-500">From your own chaotic life, upload now.</p>
//                       </div>
//                       <div className="px-2">
//                         <button
//                           disabled={!selectedFile}
//                           onClick={() => importData(selectedFile!)}
//                           className="border bg-blue-500 px-4 py-2 text-white rounded-md hover:border hover:border-blue-900 disabled:opacity-40 disabled:cursor-not-allowed
//                           text-white"> 
//                           Import Books
//                         </button>
//                       </div>
//                     </div>
//                 </div>
//               </div>
//           )}
  
//           {/* TRASHCAN FEATURE/DELETION OF BOOK CARD ONDROP */}
//           {isDraggingBook && (
//             <div
//               className="
//                 fixed bottom-6 right-6 z-50
//                 transition-all duration-300
//                 scale-100 opacity-100
//               "
//             >
//               <div
//                 onDragOver={handleDragOver}
//                 onDrop={handleDrop}
//                 onDragLeave={handleDragLeave}
//                 className={`
//                   w-20 h-20
//                   group flex items-center justify-center
//                   rounded-full
//                   px-2 py-2 border border-red-300
//                   bg-red-300
//                   text-white
//                   shadow-xl
//                   hover:scale-110
//                   hover:bg-red-500
//                   transition-transform
//                   ${setDrag ? "scale-110 bg-red-500" : ""}
//                 `}
//               > 
//               <FontAwesomeIcon 
//               icon={faTrashCan} 
//               size="2xl"
//               bounce={isDraggingBook && !setDrag}
//               />
//               </div>
  
//               {/* TOOLTIP */}
//               {/* <span
//                 className={`
//                   ${setDrag === true ? "hidden" : ""}
//                   absolute right-full bottom-6 mr-2
//                   pointer-events-none
//                   transition-opacity duration-200
//                   bg-black/80 text-white text-xs px-2 py-1 rounded-md
//                   whitespace-nowrap
//                 `}
//                 >
//                 DROP BOOKS HERE TO REMOVE.
//               </span> */}
//             </div>
//           )}
  
//           {/* CUSTOM MODAL FOR CONFIRM/CANCEL */}
  
//           {/* Undo Popup */}
//           {showUndoPopup && (
//             <div className="fixed top-14 left-1/2 bg-gray-300 py-4 px-8 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
//               <span>Deleted</span>
//               <button 
//                 className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm font-semibold flex"
//                 onClick={handleUndo}>
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   strokeWidth={2}
//                   stroke="currentColor"
//                   className="w-4 h-5"
//                 >
//                   <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
//                 </svg> Undo
//               </button>
//             </div>
//           )}
  
//           {/* CHANGES SAVED POPUP */}
//           {showStatePopup && (
//             <div className="fixed top-14 left-1/2 bg-gray-300 py-1 px-5 transform -translate-x-1/2 rounded shadow-lg flex justify-center space-x-4 animate-fadeDown">
//               <span>
//                 {alertMessage}
//                 <FontAwesomeIcon className="text-green-500" size="lg" icon={faCheck}/>
//               </span>
//             </div>
//           )}
  
//     </div>
//   );
// }


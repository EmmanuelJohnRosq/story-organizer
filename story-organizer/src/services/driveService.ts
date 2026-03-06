// SAVE DATA FROM DB IN GOOGLE DRIVE AS JSON
export async function uploadJsonToDrive(
  fileName: string,
  data: any,
  accessToken: string,
  fileId?: string,
) {
  const metadata = {
    name: `${fileName}.json`,
    mimeType: "application/json",
  };

  const file = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const method = fileId ? "PATCH" : "POST";

    const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const response = await fetch(url, 
    {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error("Drive upload failed");
  }

  return await response.json();
}

// CHECK DATA OF GOOGLE DRIVE IF EXISTING SAVES ARE EXISTING AS JSON
export async function findBackupFile(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?q=name='Story-Organizer-BackUp-Data.json' and trashed=false&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.status === 401) {
      sessionStorage.setItem("googleAuth", "false"); 
      return;
    }

  if (!response.ok) {
    throw new Error("Failed to check Drive");
  }

  const data = await response.json();
  return data.files?.[0] || null;
}

// DOWNLOAD FILE FROM GOOGLE DRIVE IF FOUND
export async function downloadDriveFile(
  fileId: string,
  accessToken: string
) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Download failed");
  }

  const blob = await response.blob();
  return new File([blob], "drive-backup.json", {
    type: "application/json",
  });
}


// DELETES ALL THE EXISTING FILES IN THE GOOGLE DRIVE
export async function deleteAllBackups(accessToken: string) {
  // 1. List all backup files
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='Story-Organizer-BackUp-Data.json' and trashed=false&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) throw new Error("Failed to list backup files");

  const data = await response.json();
  const files = data.files || [];

  if (files.length === 0) return; // nothing to delete

  // 2. Delete all files
  await Promise.all(
    files.map((file: { id: string }) =>
      fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    )
  );

  console.log(`Deleted ${files.length} backup file(s).`);
}
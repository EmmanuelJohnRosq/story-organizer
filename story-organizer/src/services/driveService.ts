type BackupPayload = Record<string, unknown>;

const MANUAL_BACKUP_FILE_NAME = "Story-Organizer-BackUp-Data";
const AUTO_BACKUP_FILE_NAME = "Story-Organizer-Auto-Backup";

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
}

function buildExactDriveQuery(fileName: string) {
  return `name='${fileName}.json' and trashed=false`;
}

function buildPrefixDriveQuery(fileNamePrefix: string) {
  return `name contains '${fileNamePrefix}' and trashed=false`;
}

// check auth token status
export async function isTokenActive(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );

    if (!response.ok) {
      sessionStorage.setItem("googleAuth", "false");
      return false;
    }

    const data = await response.json();

    // If expires_in exists and > 0, token is valid
    const isValid = data.expires_in && data.expires_in > 0;

    sessionStorage.setItem("googleAuth", isValid ? "true" : "false");
    return isValid;
  } catch {
    sessionStorage.setItem("googleAuth", "false");
    return false;
  }
}

async function listDriveFiles(query: string, accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name,createdTime,modifiedTime)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  
  if (response.ok) {
    sessionStorage.setItem("googleAuth", "true");
  }

  if (response.status === 401) {
    sessionStorage.setItem("googleAuth", "false");
  }

  if (!response.ok) {
    throw new Error("Failed to check Drive");
  }


  const data = await response.json();
  return (data.files ?? []) as DriveBackupFile[];
}

async function deleteDriveFile(fileId: string, accessToken: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete backup file");
  }
}

// SAVE DATA FROM DB IN GOOGLE DRIVE AS JSON
export async function uploadJsonToDrive(
  fileName: string,
  data: BackupPayload,
  accessToken: string,
  fileId?: string,
) {
  const metadata = {
    name: `${fileName}.json`,
    mimeType: "application/json",
  };

  const file = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  const method = fileId ? "PATCH" : "POST";

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error("Drive upload failed");
  }

  return await response.json();
}

export async function listManualBackupFiles(accessToken: string) {
  return listDriveFiles(buildPrefixDriveQuery(MANUAL_BACKUP_FILE_NAME), accessToken);
}

export async function getAutoBackupFile(accessToken: string) {
  const files = await listDriveFiles(buildExactDriveQuery(AUTO_BACKUP_FILE_NAME), accessToken);
  return files[0] ?? null;
}

export async function listRestoreBackupFiles(accessToken: string) {
  const [autoBackup, manualBackups] = await Promise.all([
    getAutoBackupFile(accessToken),
    listManualBackupFiles(accessToken),
  ]);

  return [
    ...(autoBackup ? [{ ...autoBackup, name: `${autoBackup.name} (Automatic)` }] : []),
    ...manualBackups.slice(0, 3),
  ];
}

export async function uploadManualBackup(data: BackupPayload, accessToken: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const uploadedFile = await uploadJsonToDrive(`${MANUAL_BACKUP_FILE_NAME}-${timestamp}`, data, accessToken);

  const files = await listManualBackupFiles(accessToken);

  if (files.length <= 3) {
    return uploadedFile;
  }

  const oldestFiles = [...files]
    .sort((a, b) => new Date(a.createdTime ?? 0).getTime() - new Date(b.createdTime ?? 0).getTime())
    .slice(0, Math.max(0, files.length - 3));

  await Promise.all(oldestFiles.map((file) => deleteDriveFile(file.id, accessToken)));

  return uploadedFile;
}

export async function upsertAutoBackup(data: BackupPayload, accessToken: string) {
  const existingFile = await getAutoBackupFile(accessToken);
  return uploadJsonToDrive(AUTO_BACKUP_FILE_NAME, data, accessToken, existingFile?.id);
}

// DOWNLOAD FILE FROM GOOGLE DRIVE IF FOUND
export async function downloadDriveFile(fileId: string, accessToken: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

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
  const files = await listManualBackupFiles(accessToken);

  if (files.length === 0) return;

  await Promise.all(files.map((file) => deleteDriveFile(file.id, accessToken)));

  console.log(`Deleted ${files.length} backup file(s).`);
}
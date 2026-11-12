import { getSetting, saveSetting } from "./settings-service";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export function getOAuthUrl(clientId: string, redirectUri: string): string {
  const scope = encodeURIComponent("https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file");
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
}

export async function exchangeAuthCode(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  code: string
): Promise<TokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OAuth Exchange Failed: ${errText}`);
  }

  const tokens = await response.json() as TokenResponse;
  await saveSetting("gdrive_client_id", clientId);
  await saveSetting("gdrive_client_secret", clientSecret);
  await saveSetting("gdrive_access_token", tokens.access_token);
  if (tokens.refresh_token) {
    await saveSetting("gdrive_refresh_token", tokens.refresh_token);
  }
  const expiryTime = Date.now() + tokens.expires_in * 1000;
  await saveSetting("gdrive_token_expiry", expiryTime.toString());

  return tokens;
}

export async function getAccessToken(): Promise<string> {
  const accessToken = await getSetting("gdrive_access_token");
  const refreshToken = await getSetting("gdrive_refresh_token");
  const expiryStr = await getSetting("gdrive_token_expiry");
  const clientId = await getSetting("gdrive_client_id");
  const clientSecret = await getSetting("gdrive_client_secret");

  if (!accessToken) {
    throw new Error("Google Drive is not connected.");
  }

  const expiry = expiryStr ? parseInt(expiryStr) : 0;
  // If token is expired or expires in next 30 seconds, refresh it
  if (Date.now() + 30000 >= expiry && refreshToken && clientId && clientSecret) {
    console.log("[Google Drive] Token expired, refreshing...");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (response.ok) {
      const data = await response.json() as TokenResponse;
      await saveSetting("gdrive_access_token", data.access_token);
      const newExpiry = Date.now() + data.expires_in * 1000;
      await saveSetting("gdrive_token_expiry", newExpiry.toString());
      return data.access_token;
    } else {
      const errText = await response.text();
      console.error("[Google Drive] Refresh failed:", errText);
      throw new Error(`Google Drive Session Expired. Please reconnect. Details: ${errText}`);
    }
  }

  return accessToken;
}

export async function createFolder(folderName: string, parentId?: string): Promise<string> {
  const token = await getAccessToken();
  const metadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create folder on Drive: ${err}`);
  }

  const file = await response.json();
  return file.id;
}

export async function uploadDoc(
  title: string,
  content: string,
  parentFolderId?: string
): Promise<{ fileId: string; fileUrl: string }> {
  const token = await getAccessToken();

  const metadata = {
    name: title,
    mimeType: "application/vnd.google-apps.document", // Automatically convert text to Google Doc
    parents: parentFolderId ? [parentFolderId] : undefined,
  };

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
    content +
    closeDelimiter;

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to upload doc to Drive: ${err}`);
  }

  const file = await response.json();
  return {
    fileId: file.id,
    fileUrl: `https://docs.google.com/document/d/${file.id}/edit`,
  };
}

export async function disconnectDrive(): Promise<void> {
  await saveSetting("gdrive_access_token", "");
  await saveSetting("gdrive_refresh_token", "");
  await saveSetting("gdrive_token_expiry", "");
}

let tokenClient: any = null;
let accessToken: string | null = null;
let userProfile: any = null;
let onUserLoadedCallback: ((profile: any) => void) | null = null;

const GOOGLE_ACCESS_TOKEN_KEY = "googleAccessToken";
const GOOGLE_TOKEN_EXPIRES_AT_KEY = "googleAccessTokenExpiresAt";

export function initGoogleAuth(
  clientId: string,
  onUserLoaded: (profile: any) => void
) {
  if (!window.google) return;   
    onUserLoadedCallback = onUserLoaded;

    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file openid email profile",
        callback: async (tokenResponse: { access_token: string; expires_in?: number; access_type: any; }) => {
            accessToken = tokenResponse.access_token;
            localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, tokenResponse.access_token);

            if (typeof tokenResponse.expires_in === "number") {
                const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
                localStorage.setItem(GOOGLE_TOKEN_EXPIRES_AT_KEY, expiresAt.toString());
            }
            
            const res = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",    
                {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                }
            );

            const userProfile = await res.json();
            onUserLoaded(userProfile);
            localStorage.setItem("googleConnected", JSON.stringify(userProfile)); // persist flag
            
        },
    });
}

export function signIn(): Promise<void> {
  if (!tokenClient) {
    return Promise.reject(new Error("Google auth client is not initialized."));
  }

  sessionStorage.setItem("googleAuth", "pending");

  return new Promise((resolve, reject) => {
    tokenClient.callback = async (tokenResponse: {
      access_token?: string;
      expires_in?: number;
      error?: string;
    }) => {
      if (tokenResponse.error || !tokenResponse.access_token) {
        sessionStorage.setItem("googleAuth", "false");
        reject(new Error(tokenResponse.error || "Google sign-in failed."));
        return;
      }

      try {
        accessToken = tokenResponse.access_token;
        localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, tokenResponse.access_token);

        if (typeof tokenResponse.expires_in === "number") {
          const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
          localStorage.setItem(GOOGLE_TOKEN_EXPIRES_AT_KEY, expiresAt.toString());
        }

        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const profile = await res.json();
        userProfile = profile;
        onUserLoadedCallback?.(profile);
        localStorage.setItem("googleConnected", JSON.stringify(profile));
        sessionStorage.setItem("googleAuth", "true");
        resolve();
      } catch (error) {
        sessionStorage.setItem("googleAuth", "false");
        reject(error);
      }
    };

    tokenClient.requestAccessToken();
  });
}

export function getAccessToken() {
  return accessToken;
}

export function getUserProfile() {
  return userProfile;
}

export function signOut() {
  accessToken = null;
  userProfile = null;
  localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(GOOGLE_TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem("googleConnected");
  sessionStorage.setItem("googleAuth", "false");
}

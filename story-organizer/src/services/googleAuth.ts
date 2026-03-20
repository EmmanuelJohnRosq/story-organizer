let tokenClient: any = null;
let accessToken: string | null = null;
let userProfile: any = null;

export function initGoogleAuth(
  clientId: string,
  onUserLoaded: (profile: any) => void
) {
  if (!window.google) return;   

    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file openid email profile",
        callback: async (tokenResponse: { access_token: any; access_type: any; }) => {
            accessToken = tokenResponse.access_token;
            localStorage.setItem("googleAccessToken", tokenResponse.access_token);
            
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

export function signIn() {
  if (!tokenClient) return;
  tokenClient.requestAccessToken();
  sessionStorage.setItem("googleAuth", "true");
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
  localStorage.removeItem("googleConnected");
  localStorage.removeItem("googleAccessToken");
}

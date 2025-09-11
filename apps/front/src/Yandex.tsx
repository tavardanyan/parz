import { useEffect, useState } from "react";

const CLIENT_ID = "34f0e66bbf3c4698881003cf8b09f046";
const REDIRECT_URI = "https://oauth.yandex.ru/verification_code"; // fixed
const BACKEND_URL = "http://localhost:5000";

export default function YandexLoginButton() {
  const [authCode, setAuthCode] = useState<string | null>(null);

  const handleLogin = async () => {
    const code = await window.api.auth();
    setAuthCode(code);
    console.log("Got Yandex code:", code);

    // 🔑 Now send `code` to your backend to exchange for access_token
    // fetch("http://localhost:5000/yandex/exchange", { method: "POST", body: JSON.stringify({ code }) })
  };

  return (
    <div>
      <button onClick={handleLogin}>Login with Yandex</button>
      {authCode && <p>Code: {authCode}</p>}
    </div>
  );
}
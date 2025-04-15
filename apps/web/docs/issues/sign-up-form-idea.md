# New Sign Up form (preliminary native HTML elements - change to ShadcnUI components)

```ts
// components/SignupForm.tsx
import React, { useState } from "react";
// For the eye icons, you can use any icon library (here we use Heroicons as an example)
import { EyeIcon, EyeOffIcon } from "@heroicons/react/outline";

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Basic password validation: at least 8 characters with one letter and one number
  const validatePassword = (pwd: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters and include one letter and one number."
      );
      return;
    }
    setError("");
    // Call an API route to save the user credentials to your database.
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Signup failed");
    } else {
      // For this demo, assume the API sends a verification email.
      console.log("Signup successful, verification email sent.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              cursor: "pointer",
            }}
          >
            {showPassword ? (
              <EyeOffIcon width={20} height={20} />
            ) : (
              <EyeIcon width={20} height={20} />
            )}
          </span>
        </div>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default SignupForm;
```

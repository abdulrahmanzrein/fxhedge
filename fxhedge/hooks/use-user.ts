"use client";
import { useState, useEffect } from "react";
import type { Profile } from "@/types";

export interface AppUser {
  loading: boolean;
  signedIn: boolean;
  email:    string | null;
  name:     string | null;   // preferred greeting name (business_name or email local part)
  profile:  Profile | null;
}

const INITIAL: AppUser = {
  loading:  true,
  signedIn: false,
  email:    null,
  name:     null,
  profile:  null,
};

function greetingName(email: string | null, profile: Profile | null): string | null {
  if (profile?.business_name) return profile.business_name.split(" ")[0];
  if (email) return email.split("@")[0];
  return null;
}

export function useUser(): AppUser {
  const [state, setState] = useState<AppUser>(INITIAL);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: { user: { id: string; email: string | null }; profile: Profile | null }) => {
        if (!alive) return;
        setState({
          loading:  false,
          signedIn: true,
          email:    data.user.email,
          name:     greetingName(data.user.email, data.profile),
          profile:  data.profile,
        });
      })
      .catch(() => {
        if (!alive) return;
        setState({ ...INITIAL, loading: false });
      });
    return () => { alive = false; };
  }, []);

  return state;
}

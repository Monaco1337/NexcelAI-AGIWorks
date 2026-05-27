import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, updateUser } from "@/lib/demo-users";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-Mail und Passwort sind erforderlich." },
        { status: 400 }
      );
    }

    let user;
    try {
      user = findUserByEmail(email);
      console.log("Login attempt for:", email);
      console.log("User found:", user ? "YES" : "NO");
      if (user) {
        console.log("User email:", user.email);
        console.log("User role:", user.role);
      }
    } catch (error) {
      console.error("Error finding user:", error);
      return NextResponse.json(
        { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
        { status: 500 }
      );
    }

    if (!user) {
      console.log("User not found for email:", email);
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse oder Passwort." },
        { status: 401 }
      );
    }

    const expiresAt = new Date(user.expiresAt);
    const now = new Date();
    if (expiresAt < now) {
      return NextResponse.json(
        { error: "Dein Demo-Zugang ist abgelaufen. Bitte kontaktiere uns für einen Vollzugang." },
        { status: 403 }
      );
    }

    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log("Password comparison result:", isValidPassword);
    } catch (error) {
      console.error("Error comparing password:", error);
      return NextResponse.json(
        { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      console.log("Password mismatch for user:", user.email);
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse oder Passwort." },
        { status: 401 }
      );
    }

    let session;
    try {
      session = await createSession(user);
    } catch (error) {
      console.error("Error creating session:", error);
      return NextResponse.json(
        { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "Dein Demo-Zugang ist abgelaufen." },
        { status: 403 }
      );
    }

    try {
      updateUser(user.id, { lastLogin: new Date().toISOString() });
    } catch (error) {
      console.error("Error updating user:", error);
      // Don't fail login if update fails
    }

    const response = NextResponse.json({
      success: true,
      message: "Login erfolgreich.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    try {
      const maxAge = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      response.cookies.set("session", session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: maxAge > 0 ? maxAge : 86400, // Fallback to 1 day if invalid
        path: "/",
      });
    } catch (error) {
      console.error("Error setting cookie:", error);
      // Still return success, cookie might be set by browser
    }

    return response;
  } catch (error) {
    console.error("Error during login:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}


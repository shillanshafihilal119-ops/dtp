import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { key } = await req.json();

    if (!process.env.ADMIN_ENTRY_KEY) {
      return NextResponse.json(
        { success: false, error: "Admin entry key is not configured" },
        { status: 500 }
      );
    }

    if (key !== process.env.ADMIN_ENTRY_KEY) {
      return NextResponse.json(
        { success: false, error: "Invalid entry key" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
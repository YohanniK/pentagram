import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    const apiSecret = process.env.API_SECRET;
    if (!apiSecret) {
      throw new Error("API secret not set");
    }

    if (apiSecret !== request.headers.get("x-api-secret")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const response = await fetch(
      "https://yohannik--pentagram-text-to-image-inference-web.modal.run/?prompt=" +
        text,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch image");
    }

    const imageData = await response.arrayBuffer();
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="image.png"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

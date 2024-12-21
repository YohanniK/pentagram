"use server";

export async function generateImage(text: string) {
  const response = await fetch("http://localhost:3000/api/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-secret": process.env.API_SECRET || "",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch image");
  }

  const imageData = await response.arrayBuffer();
  return imageData;
}

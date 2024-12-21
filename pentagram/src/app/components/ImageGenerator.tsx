"use client";

import { useState } from "react";

interface ImageGneratorProps {
  generateImage: (text: string) => Promise<ArrayBuffer>;
}

export default function ImageGenerator({ generateImage }: ImageGneratorProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await generateImage(inputText);
      if (response) {
        const imageUrl = URL.createObjectURL(new Blob([response]));
        setImageUrl(imageUrl);
      } else {
        setError("Failed to fetch image");
      }

      setInputText("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // TODO: Update the UI here to show the images generated

    <div className="min-h-screen flex flex-col justify-between p-8">
      <main className="flex-1">
        {imageUrl !== "" && (
          <div className="flex flex-col items-center justify-center gap-4 mt-8">
            <img
              src={imageUrl}
              alt="Generated image"
              className="w-full max-w-lg rounded-lg"
            />
          </div>
        )}
        {error !== "" && (
          <div className="text-center text-red-500 text-sm">{error}</div>
        )}
      </main>

      <footer className="w-full max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-black/[.05] dark:bg-white/[.06] border border-black/[.08] dark:border-white/[.145] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              placeholder="Describe the image you want to generate..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}

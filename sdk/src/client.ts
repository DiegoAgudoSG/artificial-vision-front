import type { AnalyzeResponse } from "./types";

export class VisionAgentSDK {
  private apiKey: string;
  private baseUrl: string;

  constructor({
    apiKey,
    baseUrl = "http://localhost:3000"
  }: {
    apiKey: string;
    baseUrl?: string;
  }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async analyzeImages(files: File[] | Blob[]): Promise<AnalyzeResponse> {
    const formData = new FormData();

    files.forEach((file, i) => {
      const name = file instanceof File && file.name ? file.name : `image_${i}.jpg`;
      formData.append("images", file, name);
    });

    const res = await fetch(`${this.baseUrl}/analyze`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch { /* ignore parse errors */ }
      throw new Error(message);
    }

    return res.json() as Promise<AnalyzeResponse>;
  }
}
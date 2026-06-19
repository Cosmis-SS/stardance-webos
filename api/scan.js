const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const PROMPT = `You are a wildlife field identification system. Examine the image carefully.

If you can see an identifiable animal, respond ONLY with raw JSON (no markdown, no backticks):
{
  "found": true,
  "commonName": "full common name",
  "scientificName": "Genus species",
  "class": "one of: Mammal, Bird, Reptile, Amphibian, Fish, Insect, Arachnid, Other",
  "conservationStatus": "IUCN status — one of: Least Concern, Near Threatened, Vulnerable, Endangered, Critically Endangered, Extinct, Data Deficient, Not Evaluated",
  "habitat": "brief description of where this species lives",
  "diet": "what it eats",
  "range": "geographic range",
  "lifespan": "typical wild lifespan",
  "size": "typical length/height and weight",
  "facts": ["interesting fact 1", "interesting fact 2", "interesting fact 3"]
}

If no animal is clearly visible or identifiable, respond with:
{"found": false, "reason": "brief explanation of what you see instead"}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: { message: "Server API key not configured" } });
  }

  const { image } = req.body || {};
  if (!image || typeof image !== "string") {
    return res.status(400).json({ error: { message: "Missing image data" } });
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: "image/jpeg", data: image } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res
      .status(500)
      .json({ error: { message: err.message || "Scan request failed" } });
  }
}

import { Groq } from "groq-sdk";

// Initialize Groq API key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// File paths for storing data
const DATA_FILE = "userData.json";
const BIO_FILE = "biography.json";

// Load user data from JSON file
let userData = {};
try {
  const fileContent = await Bun.file(DATA_FILE).text();
  userData = JSON.parse(fileContent);
} catch (error) {
  console.log("No existing user data found, starting fresh.");
  userData = {};
}

// Load biography from JSON file
let biographies = {};
try {
  const bioContent = await Bun.file(BIO_FILE).text();
  biographies = JSON.parse(bioContent);
} catch (error) {
  console.log("No biography file found, starting with empty biographies.");
  biographies = {};
}

// Helper function to save user data to JSON file
async function saveUserData() {
  try {
    await Bun.write(DATA_FILE, JSON.stringify(userData, null, 2));
    console.log("User data saved to", DATA_FILE);
  } catch (error) {
    console.error("Error saving user data:", error);
  }
}

// Helper function to format biography into a string
function formatBiography(bio) {
  if (!bio) return "No biography available for this user.";
  return `
    Name: ${bio["name"] || "Not specified"}
    Age: ${bio["age"] || "Not specified"}
    Location: ${bio["location"] || "Not specified"}
    Occupation: ${bio["occupation"] || "Not specified"}
    Hobbies: ${Array.isArray(bio["hobbies"]) ? bio["hobbies"].join(", ") : "Not specified"}
    Pet: ${bio["pet"] || "Not specified"}
    Education: ${bio["education"] || "Not specified"}
    Favorite Food: ${bio["favorite food"] || "Not specified"}
    Favorite Color: ${bio["favorite color"] || "Not specified"}
    Favorite Song: ${bio["favorite song"] || "Not specified"}
    Past Time: ${bio["past time"] || "Not specified"}
    Dream: ${bio["dream"] || "Not specified"}
    Favorite Quote: ${bio["favorite quote"] || "Not specified"}
    School: ${bio["school"] || "Not specified"}
    Year Level: ${bio["year level"] || "Not specified"}
    Thesis Project: ${bio["thesis project"] || "Not specified"}
  `.trim();
}

// Helper function to get Groq completion
async function getGroqChatCompletion(userId, message) {
  const previousMessages = userData[userId] || [];

  // Get the user's biography
  const userBio = biographies[userId];
  const bioString = formatBiography(userBio);

  // Start with a system message containing the biography
  const messages = [
    { role: "system", content: `You are an AI assistant with access to the following biography of the user: ${bioString}` },
    ...previousMessages,
    { role: "user", content: message },
  ];

  const completion = await groq.chat.completions.create({
    messages,
    model: "gemma2-9b-it",
    temperature: 0.7,
  });

  const response = completion.choices[0]?.message?.content || "Sorry, I couldn't process that.";

  userData[userId] = previousMessages.concat([
    { role: "user", content: message },
    { role: "assistant", content: response },
  ]);

  // Save to JSON file after updating
  await saveUserData();

  return response;
}

// Bun HTTP server with CORS
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Add CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "http://localhost:5173", 
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === "/api/history" && req.method === "GET") {
      const userId = url.searchParams.get("userId");

      if (!userId) {
        return new Response(JSON.stringify({ error: "Missing userId" }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      const history = userData[userId] || [];
      return new Response(JSON.stringify({ history }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/api/chat" && req.method === "POST") {
      const body = await req.json();
      const { userId, message } = body;

      if (!userId || !message) {
        return new Response(JSON.stringify({ error: "Missing userId or message" }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      try {
        const response = await getGroqChatCompletion(userId, message);
        return new Response(JSON.stringify({ response }), {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Server error:", error);
        return new Response(JSON.stringify({ error: `Failed to process request: ${error.message}` }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not Found", { status: 404, headers });
  },
});

console.log("Server running on http://localhost:3000");
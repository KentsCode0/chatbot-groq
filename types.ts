export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
  }
  
  export interface ApiResponse {
    history?: ChatMessage[];
    response?: string;
    error?: string;
  }
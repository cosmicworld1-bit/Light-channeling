export type ChatRole = "user" | "model";

export type UiCard = {
  type: string;
  [key: string]: unknown;
};

export type ChatMessage = {
  role: ChatRole;
  text: string;
  uiCards?: UiCard[];
};
